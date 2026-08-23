'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useValidateVoucher } from '@/features/billing/subscription-hooks';
import type { SubscriptionPlan } from '@/features/billing/types';

interface VoucherInputProps {
  planId: SubscriptionPlan;
  amount: number;
  onChange: (value: { code: string; discountAmount: number; discountedPrice: number } | null) => void;
}

export function VoucherInput({ planId, amount, onChange }: VoucherInputProps) {
  const [code, setCode] = useState('');
  const validate = useValidateVoucher();

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="voucher" className="mb-1 block text-xs font-medium text-muted-foreground">
            Have a voucher code?
          </label>
          <Input
            id="voucher"
            placeholder="WELCOME10"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={validate.isPending}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => validate.mutate({ code, planId, amount })}
          disabled={!code || validate.isPending}
        >
          {validate.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Tag className="h-4 w-4" />
          )}
          Apply
        </Button>
      </div>
      {validate.data && (
        <div
          className={
            validate.data.valid
              ? 'flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success'
              : 'flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          }
        >
          {validate.data.valid ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>
            {validate.data.valid
              ? `${validate.data.code} applied — you save ${validate.data.discountAmount.toLocaleString()} BDT.`
              : validate.data.message}
          </span>
        </div>
      )}
      {validate.data?.valid && (
        <input
          type="hidden"
          value={validate.data.code}
          ref={() => {
            onChange({
              code: validate.data!.code,
              discountAmount: validate.data!.discountAmount,
              discountedPrice: validate.data!.discountedPrice,
            });
          }}
        />
      )}
    </div>
  );
}