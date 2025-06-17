import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Redirect, useLocation } from 'wouter';
import { Loader2, Check, X } from 'lucide-react';

// Extend the insert schema for login form
const loginSchema = z.object({
    username: z
        .string()
        .min(3, { message: 'Username must be at least 3 characters' }),
    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginData = z.infer<typeof loginSchema>;

// Extend the insert schema for registration form
const registerSchema = z
    .object({
        username: z
            .string()
            .min(3, { message: 'Username must be at least 3 characters' }),
        password: z
            .string()
            .min(6, { message: 'Password must be at least 6 characters' }),
        confirmPassword: z.string().min(6, {
            message: 'Confirm password must be at least 6 characters',
        }),
        full_name: z.string().min(2, { message: 'Full name is required' }),
        email: z
            .string()
            .email({ message: 'Please enter a valid email address' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
    const [, setLocation] = useLocation();
    const { user, login, register, isLoading, loginState, registerState } =
        useAuth();

    // Login form
    const loginForm = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    // Registration form
    const registerForm = useForm<RegisterData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: '',
            password: '',
            confirmPassword: '',
            full_name: '',
            email: '',
        },
        mode: 'onChange', // Enable real-time validation
    });

    // Watch password fields for real-time validation
    const password = registerForm.watch('password');
    const confirmPassword = registerForm.watch('confirmPassword');

    // Check if passwords match in real-time
    const passwordsMatch =
        password && confirmPassword && password === confirmPassword;
    const showPasswordMismatch =
        confirmPassword && password && password !== confirmPassword;

    const onLoginSubmit = async (data: LoginData) => {
        await login(data);
    };

    const onRegisterSubmit = async (data: RegisterData) => {
        // Remove confirmPassword field before submitting
        const { confirmPassword, ...registerData } = data;
        await register(registerData);
    };

    // Redirect if user is already logged in
    if (user) {
        return <Redirect to="/" />;
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
            {/* Hero section */}
            <div className="bg-halliburton-blue md:w-1/2 p-8 flex flex-col justify-center">
                <div className="max-w-md mx-auto text-white">
                    <div className="flex items-center mb-6">
                        <div className="bg-halliburton-red rounded-lg p-2 mr-3">
                            <i className="ri-stack-line text-white text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Halliburton</h1>
                            <p className="text-sm text-white/80">
                                Wireline & Perforating
                            </p>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold mb-4">
                        Inventory Management System
                    </h2>

                    <p className="text-white/80 mb-6">
                        Track your tools with our advanced tagging system.
                        Efficiently manage red, yellow, green, and white tagged
                        equipment for Wireline & Perforating operations.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/10 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-tag-red/20 flex items-center justify-center text-tag-red mr-2">
                                    <i className="ri-error-warning-line"></i>
                                </div>
                                <h3 className="font-medium">Red</h3>
                            </div>
                            <p className="text-sm text-white/70">
                                Equipment requiring immediate maintenance or
                                safety inspection
                            </p>
                        </div>

                        <div className="bg-white/10 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-tag-yellow/20 flex items-center justify-center text-tag-yellow mr-2">
                                    <i className="ri-alert-line"></i>
                                </div>
                                <h3 className="font-medium">Yellow</h3>
                            </div>
                            <p className="text-sm text-white/70">
                                Equipment requiring attention but still
                                operational
                            </p>
                        </div>

                        <div className="bg-white/10 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-tag-green/20 flex items-center justify-center text-tag-green mr-2">
                                    <i className="ri-checkbox-circle-line"></i>
                                </div>
                                <h3 className="font-medium">Green</h3>
                            </div>
                            <p className="text-sm text-white/70">
                                Equipment fully operational and ready for use
                            </p>
                        </div>

                        <div className="bg-white/10 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white mr-2">
                                    <i className="ri-bookmark-line"></i>
                                </div>
                                <h3 className="font-medium">White</h3>
                            </div>
                            <p className="text-sm text-white/70">
                                Equipment pending inspection or categorization
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auth forms section */}
            <div className="md:w-1/2 p-8 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">
                            Welcome Back
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="register">
                                    Register
                                </TabsTrigger>
                            </TabsList>

                            {/* Login Form */}
                            <TabsContent value="login">
                                <form
                                    onSubmit={loginForm.handleSubmit(
                                        onLoginSubmit,
                                    )}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            Username
                                        </Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="Enter your username"
                                            {...loginForm.register('username')}
                                        />
                                        {loginForm.formState.errors
                                            .username && (
                                            <p className="text-xs text-red-500">
                                                {
                                                    loginForm.formState.errors
                                                        .username.message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter your password"
                                            {...loginForm.register('password')}
                                        />
                                        {loginForm.formState.errors
                                            .password && (
                                            <p className="text-xs text-red-500">
                                                {
                                                    loginForm.formState.errors
                                                        .password.message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-halliburton-red hover:bg-halliburton-red/90"
                                        disabled={loginState.isLoading}
                                    >
                                        {loginState.isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <i className="ri-login-box-line mr-2"></i>
                                        )}
                                        Sign In
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Register Form */}
                            <TabsContent value="register">
                                <form
                                    onSubmit={registerForm.handleSubmit(
                                        onRegisterSubmit,
                                    )}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="full_name"
                                            type="text"
                                            placeholder="Enter your full name"
                                            {...registerForm.register(
                                                'full_name',
                                            )}
                                        />
                                        {registerForm.formState.errors
                                            .full_name && (
                                            <p className="text-xs text-red-500">
                                                {
                                                    registerForm.formState
                                                        .errors.full_name
                                                        .message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email address"
                                            {...registerForm.register('email')}
                                        />
                                        {registerForm.formState.errors
                                            .email && (
                                            <p className="text-xs text-red-500">
                                                {
                                                    registerForm.formState
                                                        .errors.email.message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reg-username">
                                            Username
                                        </Label>
                                        <Input
                                            id="reg-username"
                                            type="text"
                                            placeholder="Choose a username"
                                            {...registerForm.register(
                                                'username',
                                            )}
                                        />
                                        {registerForm.formState.errors
                                            .username && (
                                            <p className="text-xs text-red-500">
                                                {
                                                    registerForm.formState
                                                        .errors.username.message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password">
                                            Password
                                        </Label>
                                        <Input
                                            id="reg-password"
                                            type="password"
                                            placeholder="Choose a password"
                                            {...registerForm.register(
                                                'password',
                                            )}
                                            className={
                                                password && password.length >= 6
                                                    ? 'border-green-500 focus:border-green-500'
                                                    : password &&
                                                        password.length > 0
                                                      ? 'border-yellow-500 focus:border-yellow-500'
                                                      : ''
                                            }
                                        />
                                        {registerForm.formState.errors
                                            .password && (
                                            <p className="text-xs text-red-500">
                                                {
                                                    registerForm.formState
                                                        .errors.password.message
                                                }
                                            </p>
                                        )}
                                        {/* Password strength indicator */}
                                        {password &&
                                            password.length > 0 &&
                                            password.length < 6 && (
                                                <p className="text-xs text-yellow-600">
                                                    Password must be at least 6
                                                    characters
                                                </p>
                                            )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="Confirm your password"
                                                {...registerForm.register(
                                                    'confirmPassword',
                                                )}
                                                className={`pr-10 ${
                                                    passwordsMatch
                                                        ? 'border-green-500 focus:border-green-500'
                                                        : showPasswordMismatch
                                                          ? 'border-red-500 focus:border-red-500'
                                                          : ''
                                                }`}
                                            />
                                            {/* Real-time validation indicator */}
                                            {confirmPassword && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {passwordsMatch ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-red-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Real-time password mismatch error */}
                                        {showPasswordMismatch && (
                                            <p className="text-xs text-red-500">
                                                Passwords don't match
                                            </p>
                                        )}
                                        {/* Form validation error */}
                                        {registerForm.formState.errors
                                            .confirmPassword &&
                                            !showPasswordMismatch && (
                                                <p className="text-xs text-red-500">
                                                    {
                                                        registerForm.formState
                                                            .errors
                                                            .confirmPassword
                                                            .message
                                                    }
                                                </p>
                                            )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-halliburton-blue hover:bg-halliburton-blue/90 disabled:opacity-50"
                                        disabled={
                                            registerState.isLoading ||
                                            showPasswordMismatch ||
                                            !registerForm.formState.isValid
                                        }
                                    >
                                        {registerState.isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <i className="ri-user-add-line mr-2"></i>
                                        )}
                                        Create Account
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
