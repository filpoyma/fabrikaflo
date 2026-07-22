import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { IUser } from '../../../types/user'

export type AuthStatus = 'unknown' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: IUser | null
  status: AuthStatus
}

const initialState: AuthState = {
  user: null,
  status: 'unknown',
}

const { reducer: authReducer, actions: authActions } = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state) {
      state.status = 'loading'
    },
    setSession(state, action: PayloadAction<IUser>) {
      state.user = action.payload
      state.status = 'authenticated'
    },
    setUnauthenticated(state) {
      state.user = null
      state.status = 'unauthenticated'
    },
    logout(state) {
      state.user = null
      state.status = 'unauthenticated'
    },
  },
})

export { authReducer, authActions }
