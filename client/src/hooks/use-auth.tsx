import {
    createContext,
    ReactNode,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { User as SelectUser, InsertUser } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

type LoginData = Pick<InsertUser, 'username' | 'password'>;

interface AuthState {
    user: SelectUser | null;
    isLoading: boolean;
    error: Error | null;
}

interface MutationState<T> {
    isLoading: boolean;
    error: Error | null;
    data: T | null;
}

interface AuthContextType extends AuthState {
    login: (credentials: LoginData) => Promise<void>;
    logout: () => Promise<void>;
    register: (data: InsertUser) => Promise<void>;
    loginState: MutationState<SelectUser>;
    logoutState: MutationState<void>;
    registerState: MutationState<SelectUser>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();

    // User state
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        error: null,
    });

    // Mutation states
    const [loginState, setLoginState] = useState<MutationState<SelectUser>>({
        isLoading: false,
        error: null,
        data: null,
    });

    const [registerState, setRegisterState] = useState<
        MutationState<SelectUser>
    >({
        isLoading: false,
        error: null,
        data: null,
    });

    const [logoutState, setLogoutState] = useState<MutationState<void>>({
        isLoading: false,
        error: null,
        data: null,
    });

    // Fetch current user on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/user', {
                    credentials: 'include',
                });

                if (response.status === 401) {
                    setState({ user: null, isLoading: false, error: null });
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const user = await response.json();
                setState({ user, isLoading: false, error: null });
            } catch (error) {
                console.error('Error fetching user:', error);
                setState({
                    user: null,
                    isLoading: false,
                    error: error as Error,
                });
            }
        };

        fetchUser();
    }, []);

    // Login function
    const login = useCallback(
        async (credentials: LoginData) => {
            setLoginState({ isLoading: true, error: null, data: null });

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials),
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Login failed');
                }

                const user = await response.json();

                setState({ user, isLoading: false, error: null });
                setLoginState({ isLoading: false, error: null, data: user });

                toast({
                    title: 'Login successful',
                    description: `Welcome back, ${user.full_name}!`,
                });
            } catch (error) {
                setLoginState({
                    isLoading: false,
                    error: error as Error,
                    data: null,
                });

                toast({
                    title: 'Login failed',
                    description: (error as Error).message,
                    variant: 'destructive',
                });
            }
        },
        [toast],
    );

    // Register function
    const register = useCallback(
        async (data: InsertUser) => {
            setRegisterState({ isLoading: true, error: null, data: null });

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Registration failed');
                }

                const user = await response.json();

                setState({ user, isLoading: false, error: null });
                setRegisterState({ isLoading: false, error: null, data: user });

                toast({
                    title: 'Registration successful',
                    description: `Welcome, ${user.full_name}!`,
                });
            } catch (error) {
                setRegisterState({
                    isLoading: false,
                    error: error as Error,
                    data: null,
                });

                toast({
                    title: 'Registration failed',
                    description: (error as Error).message,
                    variant: 'destructive',
                });
            }
        },
        [toast],
    );

    // Logout function
    const logout = useCallback(async () => {
        setLogoutState({ isLoading: true, error: null, data: null });

        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Logout failed');
            }

            setState({ user: null, isLoading: false, error: null });
            setLogoutState({ isLoading: false, error: null, data: null });

            toast({
                title: 'Logged out successfully',
            });
        } catch (error) {
            setLogoutState({
                isLoading: false,
                error: error as Error,
                data: null,
            });

            toast({
                title: 'Logout failed',
                description: (error as Error).message,
                variant: 'destructive',
            });
        }
    }, [toast]);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                register,
                loginState,
                logoutState,
                registerState,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
