/**
 * Where a freshly signed-in user should land.
 * Interests and home personalisation wait until the listing is live — same
 * progressive disclosure as web — so signup never pulls people off setup.
 */
export async function routeAfterSignIn(_role: string): Promise<'Main'> {
  return 'Main';
}
