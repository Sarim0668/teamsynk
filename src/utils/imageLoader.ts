/**
 * Load images from public folder
 * Usage: getImage('logo.png') returns '/images/logo.png'
 */

export const getImage = (filename: string): string => {
  return `/images/${filename}`
}

export const getImageUrl = (filename: string): string => {
  try {
    return require(`../assets/images/${filename}`)
  } catch {
    return `/images/${filename}`
  }
}

// Specific image helpers
export const IMAGES = {
  logo: '/images/logo.png',
  logoPng: '/images/logo.PNG',
  dashboardBg: '/images/dashboard_bg.png',
  profileBg: '/images/profile_bg.png',
  loginBg: '/images/login_bg.png',
  createSessionBg: '/images/create_session_bg.png',
  browseSessionsBg: '/images/browse_sessions_bg.png',
  marketplaceBg: '/images/marketplace_bg.png',
  findPlayersBg: '/images/find_players_bg.png',
  chatBg: '/images/chat_bg.png',
}