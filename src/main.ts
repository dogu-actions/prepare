import { ActionKit, checkoutProject, downloadApp, errorify, PrepareInputs, stringify, transformAndValidate } from '@dogu-tech/action-kit';
import { tryToQuitGamiumApp } from '@dogu-tech/gamium-kit';

ActionKit.run(async ({ options, logger, config, deviceHostClient, consoleActionClient, deviceClient }) => {
  const { DOGU_DEVICE_WORKSPACE_ON_HOST_PATH, DOGU_PROJECT_ID, DOGU_ACTION_INPUTS, DOGU_DEVICE_PLATFORM, DOGU_HOST_WORKSPACE_PATH, DOGU_DEVICE_SERIAL } = options;
  const validatedInputs = await transformAndValidate(PrepareInputs, DOGU_ACTION_INPUTS);
  const cleanInput = config.input('clean');
  if (validatedInputs.clean == null) {
    if (cleanInput.required) {
      throw new Error('Clean input is required');
    } else {
      if (typeof cleanInput.default !== 'boolean') {
        throw new Error('Clean input default value is not a boolean');
      }
      validatedInputs.clean = cleanInput.default;
    }
  }
  const { appVersion } = validatedInputs;
  let appVersionValue: string = '';
  if (typeof appVersion === 'number') {
    appVersionValue = String(appVersion);
  } else if (typeof appVersion === 'string') {
    appVersionValue = appVersion;
  } else if (typeof appVersion === 'object') {
    const value = Reflect.get(appVersion, DOGU_DEVICE_PLATFORM);
    if (typeof value !== 'string') {
      throw new Error(`Invalid app version type: ${stringify(appVersion)}`);
    }
    appVersionValue = value;
  }
  if (!appVersionValue) {
    throw new Error(`Invalid app version: ${stringify(appVersion)}`);
  }
  if (validatedInputs.gamiumServerPort == null) {
    const gamiumServerPortInput = config.input('gamiumServerPort');
    if (gamiumServerPortInput.required) {
      throw new Error('Gamium server port input is required');
    } else {
      if (typeof gamiumServerPortInput.default !== 'number') {
        throw new Error('Gamium server port input default value is not a number');
      }
      validatedInputs.gamiumServerPort = gamiumServerPortInput.default;
    }
  }
  if (validatedInputs.uninstallApp == null) {
    const uninstallAppInput = config.input('uninstallApp');
    if (uninstallAppInput.required) {
      throw new Error('Uninstall app input is required');
    } else {
      if (typeof uninstallAppInput.default !== 'boolean') {
        throw new Error('Uninstall app input default value is not a boolean');
      }
      validatedInputs.uninstallApp = uninstallAppInput.default;
    }
  }
  if (validatedInputs.retryCount == null) {
    const retryCountInput = config.input('retryCount');
    if (retryCountInput.required) {
      throw new Error('Retry count input is required');
    } else {
      if (typeof retryCountInput.default !== 'number') {
        throw new Error('Retry count input default value is not a number');
      }
      validatedInputs.retryCount = retryCountInput.default;
    }
  }
  if (validatedInputs.retryInterval == null) {
    const retryIntervalInput = config.input('retryInterval');
    if (retryIntervalInput.required) {
      throw new Error('Retry interval input is required');
    } else {
      if (typeof retryIntervalInput.default !== 'number') {
        throw new Error('Retry interval input default value is not a number');
      }
      validatedInputs.retryInterval = retryIntervalInput.default;
    }
  }
  if (validatedInputs.requestTimeout == null) {
    const requestTimeoutInput = config.input('requestTimeout');
    if (requestTimeoutInput.required) {
      throw new Error('Request timeout input is required');
    } else {
      if (typeof requestTimeoutInput.default !== 'number') {
        throw new Error('Request timeout input default value is not a number');
      }
      validatedInputs.requestTimeout = requestTimeoutInput.default;
    }
  }
  await checkoutProject(logger, consoleActionClient, deviceHostClient, DOGU_DEVICE_WORKSPACE_ON_HOST_PATH, DOGU_PROJECT_ID, validatedInputs.clean);
  const appPath = await downloadApp(logger, consoleActionClient, deviceHostClient, DOGU_DEVICE_PLATFORM, DOGU_HOST_WORKSPACE_PATH, appVersionValue);
  await tryToQuitGamiumApp(
    logger,
    deviceClient,
    deviceHostClient,
    validatedInputs.gamiumServerPort,
    DOGU_DEVICE_SERIAL,
    validatedInputs.retryCount,
    validatedInputs.retryInterval,
    validatedInputs.requestTimeout,
  );
  if (validatedInputs.uninstallApp) {
    logger.info('Uninstalling app', { appPath });
    try {
      await deviceClient.uninstallApp(DOGU_DEVICE_SERIAL, appPath);
      logger.info('App uninstalled');
    } catch (error) {
      logger.warn('Failed to uninstall app', { error: errorify(error) });
    }
  }
  logger.info('Installing app', { appPath });
  await deviceClient.installApp(DOGU_DEVICE_SERIAL, appPath);
  logger.info('App installed');
  logger.info('Run app', { appPath });
  await deviceClient.runApp(DOGU_DEVICE_SERIAL, appPath);
  logger.info('App runned');
});
