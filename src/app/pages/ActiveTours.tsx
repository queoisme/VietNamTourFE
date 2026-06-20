import { Navigate } from 'react-router'

export function ActiveTours() {
  return <Navigate to="/guide" state={{ tab: 'active' }} replace />
}
