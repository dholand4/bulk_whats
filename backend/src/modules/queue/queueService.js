const crypto = require('crypto');

const database = require('../storage/database');
const clientManager = require('../whatsapp/clientManager');
const { sendQueueItem } = require('../messages/messageSender');
const templateRepository = require('../templates/templateRepository');
const groupService = require('../whatsappGroups/groupService');

const deviceLocks = new Set();
const deviceCooldowns = new Map();
const devicePacingState = new Map();
const cancelRequests = new Set();
let workerStarted = false;
let tickInProgress = false;

const RANDOM_SEND_DELAY_MIN_SECONDS = 15;
const RANDOM_SEND_DELAY_MAX_SECONDS = 30;
const RANDOM_BATCH_SIZE_MIN = 5;
const RANDOM_BATCH_SIZE_MAX = 15;
const RANDOM_BATCH_PAUSE_MIN_SECONDS = 60;
const RANDOM_BATCH_PAUSE_MAX_SECONDS = 180;

function nowIso() {
    return new Date().toISOString();
}

function normalizeAttachments(attachments) {
    return Array.isArray(attachments)
        ? attachments
            .filter((item) => item?.path)
            .map((item) => ({
                path: item.path,
                mimeType: item.mimeType || '',
                fileName: item.fileName || '',
            }))
        : [];
}

function normalizeSchedule(scheduleAt) {
    if (!scheduleAt) {
        return nowIso();
    }

    const date = new Date(scheduleAt);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Data de agendamento invalida.');
    }

    return date.toISOString();
}

function normalizeDelaySeconds(delaySeconds) {
    const parsed = Number.parseInt(delaySeconds, 10);
    if (Number.isNaN(parsed)) {
        return RANDOM_SEND_DELAY_MIN_SECONDS;
    }

    return Math.min(RANDOM_SEND_DELAY_MAX_SECONDS, Math.max(RANDOM_SEND_DELAY_MIN_SECONDS, parsed));
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * ((max - min) + 1)) + min;
}

function pickRandomItem(items) {
    return items[randomBetween(0, items.length - 1)];
}

function getDevicePacingState(deviceId) {
    if (!devicePacingState.has(deviceId)) {
        devicePacingState.set(deviceId, {
            sentSincePause: 0,
            nextPauseThreshold: randomBetween(RANDOM_BATCH_SIZE_MIN, RANDOM_BATCH_SIZE_MAX),
        });
    }

    return devicePacingState.get(deviceId);
}

function createQueueItem(base) {
    const now = nowIso();
    return {
        id: crypto.randomUUID(),
        campaignId: base.campaignId || null,
        campaignName: String(base.campaignName || '').trim(),
        deviceId: base.deviceId,
        recipientType: base.recipientType || 'contact',
        recipientId: base.recipientId || '',
        recipientNumber: base.recipientNumber,
        contactName: base.contactName || '',
        paciente: base.paciente || '',
        profissional: base.profissional || '',
        data: base.data || '',
        hora: base.hora || '',
        message: base.message || '',
        attachments: normalizeAttachments(base.attachments),
        scheduleAt: normalizeSchedule(base.scheduleAt),
        delaySeconds: normalizeDelaySeconds(base.delaySeconds),
        status: 'pending',
        errorMessage: '',
        createdAt: now,
        updatedAt: now,
        sentAt: null,
        createdBy: base.createdBy || '',
    };
}

function ensureDeviceExists(current, deviceId) {
    const device = current.devices.find((item) => item.id === deviceId);
    if (!device) {
        throw new Error('Dispositivo selecionado nao existe.');
    }
    return device;
}

function buildHistoryEntry(item) {
    return {
        id: item.id,
        campaignId: item.campaignId,
        campaignName: item.campaignName || '',
        deviceId: item.deviceId,
        recipientType: item.recipientType || 'contact',
        recipientId: item.recipientId || '',
        recipientNumber: item.recipientNumber,
        contactName: item.contactName,
        paciente: item.paciente || '',
        profissional: item.profissional || '',
        data: item.data || '',
        hora: item.hora || '',
        message: item.message,
        attachments: item.attachments,
        scheduleAt: item.scheduleAt,
        delaySeconds: normalizeDelaySeconds(item.delaySeconds),
        status: item.status,
        errorMessage: item.errorMessage,
        sentAt: item.sentAt,
        updatedAt: item.updatedAt,
        createdBy: item.createdBy || '',
    };
}

function archiveAndRemoveQueueItem(current, queueItemId, changes = {}) {
    const itemIndex = current.queue.findIndex((entry) => entry.id === queueItemId);
    if (itemIndex === -1) {
        return null;
    }

    const nextItem = {
        ...current.queue[itemIndex],
        ...changes,
        updatedAt: changes.updatedAt || nowIso(),
    };

    current.queue.splice(itemIndex, 1);
    current.history.unshift(buildHistoryEntry(nextItem));
    return nextItem;
}

async function createItems(payload, auth) {
    const current = database.load();
    const selectedDeviceId = auth?.email || payload?.deviceId;
    ensureDeviceExists(current, selectedDeviceId);

    const recipients = Array.isArray(payload?.recipients) ? payload.recipients : [];
    if (recipients.length === 0) {
        throw new Error('Informe ao menos um destinatario.');
    }

    let templateVariants = [];
    if (payload?.templateId) {
        const template = await templateRepository.getTemplate(payload.templateId, auth.email);
        if (!template || !template.active) {
            throw new Error('Template selecionado nao foi encontrado.');
        }

        templateVariants = template.variants.filter((variant) => variant.active && String(variant.body || '').trim());
        if (templateVariants.length === 0) {
            throw new Error('O template selecionado nao possui variacoes ativas.');
        }
    }

    const campaignId = recipients.length > 1 ? crypto.randomUUID() : null;
    const items = [];

    for (const recipient of recipients) {
        const recipientType = recipient.type === 'group' ? 'group' : 'contact';
        const message = templateVariants.length > 0 ? pickRandomItem(templateVariants).body : payload.message;

        if (recipientType === 'group') {
            // eslint-disable-next-line no-await-in-loop
            const storedGroup = await groupService.validateStoredGroup(auth.email, recipient.id || recipient.number);
            if (!storedGroup) {
                throw new Error(`Grupo nao encontrado: ${recipient.name || recipient.id || recipient.number}.`);
            }

            items.push(createQueueItem({
                campaignId,
                campaignName: payload.campaignName,
                deviceId: selectedDeviceId,
                recipientType,
                recipientId: storedGroup.whatsappGroupId,
                recipientNumber: storedGroup.whatsappGroupId,
                contactName: storedGroup.name,
                message,
                attachments: payload.attachments,
                scheduleAt: payload.scheduleAt,
                delaySeconds: payload.delaySeconds,
                createdBy: auth?.email || '',
            }));
            continue;
        }

        items.push(createQueueItem({
            campaignId,
            campaignName: payload.campaignName,
            deviceId: selectedDeviceId,
            recipientType,
            recipientId: '',
            recipientNumber: recipient.number,
            contactName: recipient.name,
            paciente: recipient.paciente,
            profissional: recipient.profissional,
            data: recipient.data,
            hora: recipient.hora,
            message,
            attachments: payload.attachments,
            scheduleAt: payload.scheduleAt,
            delaySeconds: payload.delaySeconds,
            createdBy: auth?.email || '',
        }));
    }

    await database.update((dbState) => {
        dbState.queue.unshift(...items);
    });

    return {
        items,
        campaignId,
    };
}

async function enqueue(payload, auth) {
    const result = await createItems(payload, auth);
    return {
        statusCode: 201,
        body: {
            message: `${result.items.length} item(ns) adicionados a fila.`,
            items: result.items,
            campaignId: result.campaignId,
        },
    };
}

async function sendNow(payload, auth) {
    const result = await createItems({
        ...payload,
        scheduleAt: nowIso(),
    }, auth);

    return {
        statusCode: 201,
        body: {
            message: `${result.items.length} envio(s) criado(s) para processamento imediato.`,
            items: result.items,
            campaignId: result.campaignId,
        },
    };
}

async function listQueue(auth) {
    const current = database.load();
    return {
        statusCode: 200,
        body: {
            items: current.queue
                .filter((item) => item.deviceId === auth.email && ['pending', 'processing'].includes(item.status))
                .sort((a, b) => new Date(a.scheduleAt) - new Date(b.scheduleAt)),
        },
    };
}

async function listHistory(auth) {
    const current = database.load();
    return {
        statusCode: 200,
        body: {
            items: current.history
                .filter((item) => item.deviceId === auth.email)
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
        },
    };
}

async function cancelItem(queueItemId, auth) {
    let updated = null;

    await database.update((current) => {
        const item = current.queue.find((entry) => entry.id === queueItemId);
        if (!item) {
            throw new Error('Item nao encontrado.');
        }
        if (item.deviceId !== auth.email) {
            throw new Error('Item nao pertence a este usuario.');
        }

        if (item.status === 'sent') {
            throw new Error('Este item ja foi enviado. Use apagar para removelo dos relatorios.');
        }

        if (item.status === 'processing') {
            cancelRequests.add(item.id);
            item.errorMessage = 'Cancelamento solicitado durante o processamento.';
            item.updatedAt = nowIso();
            updated = { ...item };
            return;
        }

        updated = archiveAndRemoveQueueItem(current, item.id, {
            status: 'cancelled',
            errorMessage: '',
        });
    });

    return {
        statusCode: 200,
        body: {
            item: updated,
        },
    };
}

async function reprocessItem(queueItemId, auth) {
    let updated = null;

    await database.update((current) => {
        const queueItem = current.queue.find((entry) => entry.id === queueItemId);
        const historyItem = current.history.find((entry) => entry.id === queueItemId);
        const item = queueItem || historyItem;

        if (!item) {
            throw new Error('Item nao encontrado.');
        }
        if (item.deviceId !== auth.email) {
            throw new Error('Item nao pertence a este usuario.');
        }

        if (!['error', 'cancelled'].includes(item.status)) {
            throw new Error('Somente itens com erro ou cancelados podem ser reprocessados.');
        }

        cancelRequests.delete(item.id);
        const reprocessedItem = createQueueItem({
            campaignId: item.campaignId,
            campaignName: item.campaignName,
            deviceId: item.deviceId,
            recipientType: item.recipientType || 'contact',
            recipientId: item.recipientId || '',
            recipientNumber: item.recipientNumber,
            contactName: item.contactName,
            paciente: item.paciente,
            data: item.data,
            hora: item.hora,
            message: item.message,
            attachments: item.attachments,
            scheduleAt: nowIso(),
            delaySeconds: item.delaySeconds,
            createdBy: auth.email,
        });

        current.queue.unshift(reprocessedItem);
        updated = { ...reprocessedItem };
    });

    return {
        statusCode: 200,
        body: {
            item: updated,
        },
    };
}

async function deleteQueueItem(queueItemId, auth) {
    let removed = null;

    await database.update((current) => {
        const itemIndex = current.queue.findIndex((entry) => entry.id === queueItemId);
        if (itemIndex === -1) {
            throw new Error('Item nao encontrado.');
        }

        const item = current.queue[itemIndex];
        if (item.deviceId !== auth.email) {
            throw new Error('Item nao pertence a este usuario.');
        }

        if (item.status === 'processing') {
            throw new Error('Nao e possivel apagar um item em processamento. Solicite o cancelamento primeiro.');
        }

        removed = current.queue.splice(itemIndex, 1)[0];
        cancelRequests.delete(queueItemId);
    });

    return {
        statusCode: 200,
        body: {
            item: removed,
            message: 'Item removido da fila.',
        },
    };
}

async function deleteHistoryItem(historyItemId, auth) {
    void historyItemId;
    void auth;
    throw new Error('O historico nao pode ser apagado.');
}

async function updateQueueItem(queueItemId, mutator) {
    await database.update((current) => {
        const item = current.queue.find((entry) => entry.id === queueItemId);
        if (!item) {
            return;
        }

        mutator(item, current);
    });
}

function getDeviceCooldownRemaining(deviceId) {
    const nextAvailableAt = deviceCooldowns.get(deviceId) || 0;
    return nextAvailableAt - Date.now();
}

function scheduleDeviceCooldown(deviceId, delaySeconds) {
    deviceCooldowns.set(deviceId, Date.now() + (normalizeDelaySeconds(delaySeconds) * 1000));
}

function scheduleNextDeviceCooldown(deviceId) {
    const pacingState = getDevicePacingState(deviceId);
    pacingState.sentSincePause += 1;

    let nextCooldownSeconds = randomBetween(RANDOM_SEND_DELAY_MIN_SECONDS, RANDOM_SEND_DELAY_MAX_SECONDS);

    if (pacingState.sentSincePause >= pacingState.nextPauseThreshold) {
        nextCooldownSeconds = randomBetween(RANDOM_BATCH_PAUSE_MIN_SECONDS, RANDOM_BATCH_PAUSE_MAX_SECONDS);
        pacingState.sentSincePause = 0;
        pacingState.nextPauseThreshold = randomBetween(RANDOM_BATCH_SIZE_MIN, RANDOM_BATCH_SIZE_MAX);
    }

    scheduleDeviceCooldown(deviceId, nextCooldownSeconds);
    return nextCooldownSeconds;
}

async function processItem(item) {
    if (deviceLocks.has(item.deviceId)) {
        return;
    }

    if (getDeviceCooldownRemaining(item.deviceId) > 0) {
        return;
    }

    deviceLocks.add(item.deviceId);

    try {
        const current = database.load();
        const device = current.devices.find((entry) => entry.id === item.deviceId);
        if (!device) {
            await updateQueueItem(item.id, (queueItem, dbState) => {
                archiveAndRemoveQueueItem(dbState, queueItem.id, {
                    status: 'error',
                    errorMessage: 'Dispositivo removido.',
                });
            });
            return;
        }

        const deviceRuntime = clientManager.getDeviceRuntime(device.id);
        if (!deviceRuntime.hasClient) {
            await clientManager.initializeDevice(device);
        }

        const refreshedDatabase = database.load();
        const refreshedDevice = refreshedDatabase.devices.find((entry) => entry.id === item.deviceId);

        if (!refreshedDevice || !['connected', 'authenticated'].includes(refreshedDevice.status)) {
            await updateQueueItem(item.id, (queueItem, dbState) => {
                archiveAndRemoveQueueItem(dbState, queueItem.id, {
                    status: 'error',
                    errorMessage: 'Dispositivo nao conectado para envio.',
                });
            });
            return;
        }

        await updateQueueItem(item.id, (queueItem) => {
            queueItem.status = 'processing';
            queueItem.errorMessage = '';
            queueItem.updatedAt = nowIso();
        });

        const freshState = database.load();
        const freshItem = freshState.queue.find((entry) => entry.id === item.id);
        if (!freshItem) {
            return;
        }

        if (cancelRequests.has(item.id)) {
            cancelRequests.delete(item.id);
            await updateQueueItem(item.id, (queueItem, dbState) => {
                archiveAndRemoveQueueItem(dbState, queueItem.id, {
                    status: 'cancelled',
                    errorMessage: '',
                });
            });
            return;
        }

        await sendQueueItem(item);
        await updateQueueItem(item.id, (queueItem, dbState) => {
            archiveAndRemoveQueueItem(dbState, queueItem.id, {
                status: 'sent',
                errorMessage: '',
                sentAt: nowIso(),
            });
            scheduleNextDeviceCooldown(queueItem.deviceId);
        });
    } catch (error) {
        await updateQueueItem(item.id, (queueItem, dbState) => {
            if (cancelRequests.has(queueItem.id)) {
                cancelRequests.delete(queueItem.id);
                archiveAndRemoveQueueItem(dbState, queueItem.id, {
                    status: 'cancelled',
                    errorMessage: '',
                });
            } else {
                archiveAndRemoveQueueItem(dbState, queueItem.id, {
                    status: 'error',
                    errorMessage: error.message,
                });
            }
        });
    } finally {
        deviceLocks.delete(item.deviceId);
    }
}

async function tick() {
    if (tickInProgress) {
        return;
    }

    tickInProgress = true;

    try {
        const current = database.load();
        const dueItems = current.queue
            .filter((item) => item.status === 'pending' && new Date(item.scheduleAt) <= new Date())
            .sort((a, b) => new Date(a.scheduleAt) - new Date(b.scheduleAt));

        const nextItemByDevice = new Map();

        for (const item of dueItems) {
            if (deviceLocks.has(item.deviceId)) {
                continue;
            }

            if (getDeviceCooldownRemaining(item.deviceId) > 0) {
                continue;
            }

            if (!nextItemByDevice.has(item.deviceId)) {
                nextItemByDevice.set(item.deviceId, item);
            }
        }

        await Promise.all(
            Array.from(nextItemByDevice.values()).map((item) =>
                processItem(item).catch((error) => {
                    console.error(`Erro ao processar item ${item.id}:`, error.message);
                })),
        );
    } finally {
        tickInProgress = false;
    }
}

function startWorker() {
    if (workerStarted) {
        return;
    }

    workerStarted = true;
    setInterval(() => {
        tick().catch((error) => {
            console.error('Erro no worker da fila:', error.message);
        });
    }, 2000);
}

async function getSummary(auth) {
    const current = database.load();
    const connectedDevices = current.devices.filter((item) => item.id === auth.email && item.status === 'connected').length;
    const pendingQueue = current.queue.filter((item) => item.deviceId === auth.email && item.status === 'pending').length;
    const completedSends = current.history.filter((item) => item.deviceId === auth.email && item.status === 'sent').length;
    const recentFailures = current.history.filter((item) => item.deviceId === auth.email && item.status === 'error').slice(0, 10).length;

    return {
        statusCode: 200,
        body: {
            summary: {
                connectedDevices,
                pendingQueue,
                completedSends,
                recentFailures,
            },
        },
    };
}

module.exports = {
    enqueue,
    sendNow,
    listQueue,
    listHistory,
    cancelItem,
    reprocessItem,
    deleteQueueItem,
    startWorker,
    getSummary,
};
