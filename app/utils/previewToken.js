export async function generateToken() {
  const { token } = await $fetch('/api/preview-token')
  return token
}
