"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action_kit_1 = require("@dogu-tech/action-kit");
const toolkit_1 = require("@dogu-tech/toolkit");
action_kit_1.ActionKit.run(async ({ options, logger, input, deviceHostClient, consoleActionClient, deviceClient }) => {
    const { DOGU_DEVICE_WORKSPACE_PATH, DOGU_PROJECT_ID, DOGU_DEVICE_PLATFORM, DOGU_HOST_WORKSPACE_PATH, DOGU_DEVICE_SERIAL, DOGU_RUN_TYPE } = options;
    const clean = input.get('clean');
    const appVersion = input.get('appVersion');
    if (!(0, action_kit_1.isAppVersion)(appVersion)) {
        throw new Error(`Invalid app version: ${(0, action_kit_1.stringify)(appVersion)}`);
    }
    const currentPlatformAppVersion = typeof appVersion === 'object'
        ? (() => {
            const platformAppVersion = Reflect.get(appVersion, DOGU_DEVICE_PLATFORM);
            if (!platformAppVersion) {
                throw new Error(`Invalid app version: ${(0, action_kit_1.stringify)(appVersion)} for platform: ${DOGU_DEVICE_PLATFORM}`);
            }
            return platformAppVersion;
        })()
        : String(appVersion);
    const gamiumEnginePort = input.get('gamiumEnginePort');
    const uninstallApp = input.get('uninstallApp');
    const retryCount = input.get('retryCount');
    const retryInterval = input.get('retryInterval');
    const requestTimeout = input.get('requestTimeout');
    const branchOrTag = input.get('branchOrTag');
    const optionsConfig = await action_kit_1.OptionsConfig.load();
    if (optionsConfig.get('localUserProject.use', false)) {
        logger.info('Using local user project...');
    }
    else {
        await (0, action_kit_1.checkoutProject)(logger, consoleActionClient, deviceHostClient, DOGU_DEVICE_WORKSPACE_PATH, DOGU_PROJECT_ID, branchOrTag, clean);
    }
    const appPath = await (0, action_kit_1.downloadApp)(logger, consoleActionClient, deviceHostClient, DOGU_DEVICE_PLATFORM, DOGU_HOST_WORKSPACE_PATH, currentPlatformAppVersion);
    await (0, toolkit_1.tryToQuitGamiumApp)(logger, deviceClient, deviceHostClient, gamiumEnginePort, DOGU_DEVICE_SERIAL, DOGU_DEVICE_PLATFORM, retryCount, retryInterval, requestTimeout);
    if (uninstallApp) {
        logger.info('Uninstalling app...', { appPath });
        try {
            await deviceClient.uninstallApp(DOGU_DEVICE_SERIAL, appPath);
            logger.info('App uninstalled');
        }
        catch (error) {
            logger.warn('Failed to uninstall app', { error: (0, action_kit_1.errorify)(error) });
        }
    }
    logger.info('Installing app...', { appPath });
    await deviceClient.installApp(DOGU_DEVICE_SERIAL, appPath);
    logger.info('App installed');
    logger.info('Run app...', { appPath });
    await deviceClient.runApp(DOGU_DEVICE_SERIAL, appPath);
    logger.info('App runned');
});
//# sourceMappingURL=main.js.map