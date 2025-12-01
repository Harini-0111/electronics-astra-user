import api from '../api/axiosInstance'

export async function getFriendProfile(userid) {
  if (!userid) throw new Error('userid required')
  const res = await api.get(`/friend-profile/${userid}`)
  return res.data.data
}
