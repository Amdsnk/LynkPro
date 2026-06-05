import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      toast.error('Invalid payment session');
      navigate('/invoices');
      return;
    }

    verifyPayment(sessionId);
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify_stripe_payment', {
        body: { sessionId },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || error.message);
      }

      if (data?.data?.verified) {
        setVerified(true);
        setPaymentDetails(data.data);
        toast.success('Payment verified successfully!');
      } else {
        setVerified(false);
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Verifying Payment...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we confirm your payment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {verified ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Payment Successful
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                Payment Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your payment has been processed successfully.
                </p>
                {paymentDetails && (
                  <div className="border rounded-lg p-4 space-y-2 bg-accent/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">
                        ${(paymentDetails.amount / 100).toFixed(2)} {paymentDetails.currency?.toUpperCase()}
                      </span>
                    </div>
                    {paymentDetails.customerEmail && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{paymentDetails.customerEmail}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span className="font-mono text-xs">{paymentDetails.paymentIntentId}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/orders')} className="flex-1">
                  View Orders
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => navigate('/invoices')} variant="outline" className="flex-1">
                  Back to Invoices
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                We couldn't verify your payment. Please contact support if you believe this is an error.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/invoices')} className="flex-1">
                  Back to Invoices
                </Button>
                <Button onClick={() => navigate('/orders')} variant="outline" className="flex-1">
                  View Orders
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
