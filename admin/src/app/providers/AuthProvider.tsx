import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { authActions } from '../../store/reducers/auth'
import { refreshAccessToken, setAccessToken } from '../../api/authSession.ts'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      dispatch(authActions.setLoading())

      const session = await refreshAccessToken()
      if (cancelled) return

      if (session) {
        dispatch(authActions.setSession(session.user))
        return
      }

      setAccessToken(null)
      dispatch(authActions.setUnauthenticated())
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [dispatch])

  return <>{children}</>
}
