import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
});

const resetPasswordSchema = z
    .object({
        code: z.string().min(1, { message: 'Verification code is required' }),
        newPassword: z
            .string()
            .min(6, { message: 'Password must be at least 6 characters' }),
        confirmPassword: z.string().min(1, {
            message: 'Please confirm your password',
        }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

interface PasswordResetProps {
    onBack: () => void;
}

export default function PasswordReset({ onBack }: PasswordResetProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [isLoading, setIsLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState('');

    // Forgot password form
    const forgotPasswordForm = useForm<ForgotPasswordData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    // Reset password form
    const resetPasswordForm = useForm<ResetPasswordData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            code: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onForgotPasswordSubmit = async (data: ForgotPasswordData) => {
        setIsLoading(true);
        console.log('Sending forgot password request for email:', data.email);
        
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Check if response is HTML (error page) instead of JSON
            const contentType = response.headers.get('content-type');
            console.log('Content type:', contentType);
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Received HTML instead of JSON:', text.substring(0, 200));
                throw new Error('Server error: Please check if the backend server is running');
            }

            const result = await response.json();
            console.log('API response:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send reset code');
            }

            setUserEmail(data.email);
            setUserId(result.userId || 'temp-id'); // Fallback ID
            setStep('reset');

            toast({
                title: 'Reset Code Sent!',
                description: 'Please check your email for a password reset code.',
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            toast({
                title: 'Request Failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to send reset code. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const onResetPasswordSubmit = async (data: ResetPasswordData) => {
        setIsLoading(true);
        
        console.log('Reset password data:', {
            email: userEmail,
            code: data.code,
            userId: userId,
            hasNewPassword: !!data.newPassword
        });
        
        // Validate all fields are present
        if (!userEmail || !data.code || !userId || !data.newPassword) {
            console.error('Missing fields:', {
                userEmail: !!userEmail,
                code: !!data.code,
                userId: !!userId,
                newPassword: !!data.newPassword
            });
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
        
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    code: data.code.trim(),
                    userId: userId,
                    newPassword: data.newPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to reset password');
            }

            toast({
                title: 'Password Reset Successful!',
                description: 'Your password has been updated. You can now log in with your new password.',
            });

            onBack();
        } catch (error) {
            console.error('Reset password error:', error);
            toast({
                title: 'Reset Failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to reset password. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    userId: userId,
                    type: 'password_reset',
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to resend code');
            }

            toast({
                title: 'Code Resent!',
                description: 'A new verification code has been sent to your email.',
            });
        } catch (error) {
            console.error('Resend code error:', error);
            toast({
                title: 'Resend Failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to resend code. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1 p-3 sm:p-4 lg:p-6">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="p-0 h-auto"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {step === 'request' ? 'Forgot Password' : 'Reset Password'}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                {step === 'request' ? (
                    <form
                        onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}
                        className="space-y-4"
                    >
                        <div className="text-center mb-4">
                            <Mail className="h-12 w-12 text-halliburton-blue mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                                Enter your email address and we'll send you a code to reset
                                your password.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email address"
                                {...forgotPasswordForm.register('email')}
                            />
                            {forgotPasswordForm.formState.errors.email && (
                                <p className="text-xs text-red-500">
                                    {forgotPasswordForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-halliburton-blue hover:bg-halliburton-blue/90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Mail className="h-4 w-4 mr-2" />
                            )}
                            Send Reset Code
                        </Button>
                    </form>
                ) : (
                    <form
                        onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
                        className="space-y-4"
                    >
                        <div className="text-center mb-4">
                            <p className="text-sm text-gray-600">
                                Enter the 6-digit code sent to{' '}
                                <span className="font-medium">{userEmail}</span> and your new
                                password.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Verification Code</Label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="Enter verification code"
                                {...resetPasswordForm.register('code')}
                            />
                            {resetPasswordForm.formState.errors.code && (
                                <p className="text-xs text-red-500">
                                    {resetPasswordForm.formState.errors.code.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                {...resetPasswordForm.register('newPassword')}
                            />
                            {resetPasswordForm.formState.errors.newPassword && (
                                <p className="text-xs text-red-500">
                                    {resetPasswordForm.formState.errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                {...resetPasswordForm.register('confirmPassword')}
                            />
                            {resetPasswordForm.formState.errors.confirmPassword && (
                                <p className="text-xs text-red-500">
                                    {resetPasswordForm.formState.errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-halliburton-red hover:bg-halliburton-red/90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <i className="ri-lock-line mr-2"></i>
                            )}
                            Reset Password
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isLoading}
                                className="text-sm text-halliburton-blue hover:underline disabled:opacity-50"
                            >
                                Didn't receive the code? Resend
                            </button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}