"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const action_kit_1 = require("@dogu-tech/action-kit");
const toolkit_1 = require("@dogu-tech/toolkit");
const path_1 = __importDefault(require("path"));
action_kit_1.ActionKit.run(async ({ options, logger, input, deviceHostClient, consoleActionClient, deviceClient }) => {
    const { DOGU_ROUTINE_WORKSPACE_PATH, DOGU_DEVICE_PLATFORM, DOGU_HOST_WORKSPACE_PATH, DOGU_DEVICE_SERIAL } = options;
    const clean = input.get('clean');
    const appVersion = input.get('appVersion');
    const appPackageName = input.get('appPackageName');
    if (!(0, action_kit_1.isAppVersion)(appVersion)) {
        throw new Error(`Invalid app version: ${(0, action_kit_1.stringify)(appVersion)}`);
    }
    const gamiumEnginePort = input.get('gamiumEnginePort');
    const uninstallApp = input.get('uninstallApp');
    const retryCount = input.get('retryCount');
    const retryInterval = input.get('retryInterval');
    const requestTimeout = input.get('requestTimeout');
    const branch = input.get('branch');
    const tag = input.get('tag');
    const checkoutPath = input.get('checkoutPath');
    const checkoutUrl = input.get('checkoutUrl');
    logger.info('resolve checkout path... from', { DOGU_ROUTINE_WORKSPACE_PATH, checkoutPath });
    const resolvedCheckoutPath = path_1.default.resolve(DOGU_ROUTINE_WORKSPACE_PATH, checkoutPath);
    logger.info('resolved checkout path', { resolvedCheckoutPath });
    await (0, action_kit_1.checkoutProject)(logger, consoleActionClient, deviceHostClient, resolvedCheckoutPath, clean, branch, tag, checkoutUrl);
    let appPath = '';
    const resolvedAppVersion = appVersion || process.env.DOGU_APP_VERSION || '';
    const resolvedAppPackageName = appPackageName || process.env.DOGU_APP_PACKAGE_NAME || '';
    if (resolvedAppPackageName) {
        const currentPlatformPackageName = typeof resolvedAppPackageName === 'object'
            ? (() => {
                const platformAppVersion = Reflect.get(resolvedAppPackageName, DOGU_DEVICE_PLATFORM);
                if (!platformAppVersion) {
                    throw new Error(`Invalid app package name: ${(0, action_kit_1.stringify)(resolvedAppPackageName)} for platform: ${DOGU_DEVICE_PLATFORM}`);
                }
                return platformAppVersion;
            })()
            : String(resolvedAppPackageName);
        appPath = await (0, action_kit_1.downloadApp)(logger, consoleActionClient, deviceHostClient, DOGU_DEVICE_PLATFORM, DOGU_HOST_WORKSPACE_PATH, { appPackageName: currentPlatformPackageName });
    }
    else if (resolvedAppVersion) {
        const currentPlatformAppVersion = typeof resolvedAppVersion === 'object'
            ? (() => {
                const platformAppVersion = Reflect.get(resolvedAppVersion, DOGU_DEVICE_PLATFORM);
                if (!platformAppVersion) {
                    throw new Error(`Invalid app version: ${(0, action_kit_1.stringify)(resolvedAppVersion)} for platform: ${DOGU_DEVICE_PLATFORM}`);
                }
                return platformAppVersion;
            })()
            : String(resolvedAppVersion);
        appPath = await (0, action_kit_1.downloadApp)(logger, consoleActionClient, deviceHostClient, DOGU_DEVICE_PLATFORM, DOGU_HOST_WORKSPACE_PATH, { appVersion: currentPlatformAppVersion });
    }
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