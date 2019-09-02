import { URL } from 'whatwg-url'
import StorageManager from '@worldbrain/storex'
import initStorex from '../search/memory-storex'
import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import {
    createBackgroundModules,
    registerBackgroundModuleCollections,
} from 'src/background-script/setup'
import { setStorex } from 'src/search/get-db'
import { MemoryLocalStorage } from 'src/util/tests/local-storage'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import {
    BackgroundIntegrationTestSetup,
    BackgroundIntegrationTest,
} from './integration-tests'

async function setupTest(): Promise<BackgroundIntegrationTestSetup> {
    if (typeof window === 'undefined') {
        global['URL'] = URL
    }

    const storageManager = initStorex()
    const backgroundModules = createBackgroundModules({
        storageManager,
        browserAPIs: {
            storage: {
                local: new MemoryLocalStorage(),
            },
            bookmarks: {
                onCreated: { addListener: () => {} },
                onRemoved: { addListener: () => {} },
            },
        } as any,
    })
    registerBackgroundModuleCollections(storageManager, backgroundModules)
    const clientSyncLog = new ClientSyncLogStorage({ storageManager })
    registerModuleMapCollections(storageManager.registry, {
        clientSyncLog,
    })

    await storageManager.finishInitialization()

    const syncLoggingMiddleware = new SyncLoggingMiddleware({
        storageManager,
        clientSyncLog,
        includeCollections: ['customLists', 'pageListEntries'],
    })
    storageManager.setMiddleware([syncLoggingMiddleware])

    setStorex(storageManager)

    return {
        storageManager,
        backgroundModules,
    }
}

async function setupSharedSyncLog() {
    const sharedStorageManager = new StorageManager({
        backend: new DexieStorageBackend({
            dbName: 'shared',
            idbImplementation: inMemory(),
        }),
    })
    const sharedSyncLog = new SharedSyncLogStorage({
        storageManager: sharedStorageManager,
        autoPkType: 'int',
    })
    registerModuleMapCollections(sharedStorageManager.registry, {
        sharedSyncLog,
    })
    await sharedStorageManager.finishInitialization()
    return sharedSyncLog
}

export function registerBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
) {
    it(test.description, async () => {
        const setup = await setupTest()
        const testOptions = await test.instantiate()
        for (const step of testOptions.steps) {
            if (step.preCheck) {
                await step.preCheck({ setup })
            }
            await step.execute({ setup })
            if (step.postCheck) {
                await step.postCheck({ setup })
            }
        }
    })
}
