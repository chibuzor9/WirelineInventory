import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const otpSchema = z.object({
    code: z
        .string()
        .length(6, { message: 'OTP code must be exactly 6 digits' })
        .regex(/^\d+$/, { message: 'OTP code must contain only numbers' }),
});

type OtpData = z.infer<typeof otpSchema>;

interface OtpVerificationProps {
    email: string;
    userId: string;
    onVerified: () => void;
    onBack: () => void;
}

export default function OtpVerification({
    email,
    userId,
    onVerified,
    onBack,
}: OtpVerificationProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [canResend, setCanResend] = useState(false);
    const { toast } = useToast();

    const form = useForm<OtpData>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            code: '',
        },
    });

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const onSubmit = async (data: OtpData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    code: data.code,
                    userId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Verification failed');
            }

            toast({
                title: 'Email Verified!',
                description: 'Your email has been successfully verified.',
            });

            onVerified();
        } catch (error) {
            console.error('OTP verification error:', error);
            toast({
                title: 'Verification Failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Invalid or expired code. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    userId,
                    type: 'email_verification',
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to resend code');
            }

            toast({
                title: 'Code Resent',
                description: 'A new verification code has been sent to your email.',
            });

            // Reset timer
            setTimeLeft(600);
            setCanResend(false);
            form.reset();
        } catch (error) {
            console.error('Resend OTP error:', error);
            toast({
                title: 'Resend Failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to resend verification code. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-xl sm:text-2xl font-bold">
                        Verify Your Email
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                        We've sent a 6-digit verification code to:
                    </p>
                    <p className="font-medium text-foreground">{email}</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Verification Code</Label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="text-center text-lg font-mono tracking-widest"
                            {...form.register('code')}
                            disabled={isLoading}
                        />
                        {form.formState.errors.code && (
                            <p className="text-xs text-red-500">
                                {form.formState.errors.code.message}
                            </p>
                        )}
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        {timeLeft > 0 ? (
                            <p>Code expires in {formatTime(timeLeft)}</p>
                        ) : (
                            <p className="text-red-500">Code has expired</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-halliburton-blue hover:bg-halliburton-blue/90"
                        disabled={isLoading || timeLeft === 0}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Verify Email
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                            Didn't receive the code?
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResendOtp}
                            disabled={!canResend || isResending || timeLeft > 0}
                        >
                            {isResending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Mail className="h-4 w-4 mr-2" />
                            )}
                            Resend Code
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}