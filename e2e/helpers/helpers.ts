export const generateRandomString = (length: number): string => {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ          '
  let randomString = ''
  for (let i = 0; i < length; i++) {
    const randomChar = characters.charAt(
      Math.floor(Math.random() * characters.length),
    )
    randomString += randomChar
  }
  return randomString.replace(/\s+/g, ' ').trim()
}
