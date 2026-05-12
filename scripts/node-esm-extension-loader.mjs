export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    const canRetryWithJs = (
      error?.code === 'ERR_MODULE_NOT_FOUND'
      && (specifier.startsWith('./') || specifier.startsWith('../'))
      && !specifier.match(/\.[cm]?js$/)
    );

    if (!canRetryWithJs) throw error;
    return defaultResolve(`${specifier}.js`, context, defaultResolve);
  }
}
