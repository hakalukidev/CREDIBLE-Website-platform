'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { formatDate } from '@/lib/utils';
import type { DiscountType, SubscriptionPlan } from '@/features/billing/types';
import { Loader2, Plus, Tag, Trash2 } from 'lucide-react';

interface VoucherRow {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minPurchaseAmount?: number | null;
  maxUses?: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicablePlans: SubscriptionPlan[];
}

interface VoucherListResponse {
  success: true;
  data: VoucherRow[];
  meta?: { page: number; perPage: number; total: number; totalPages: number };
}

const ALL_PLANS: SubscriptionPlan[] = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];

export default function AdminVouchersPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
  );
  const [plans, setPlans] = useState<SubscriptionPlan[]>(['BASIC', 'PROFESSIONAL']);

  const { data, isLoading } = useQuery({
    queryKey: qk.billing.adminVouchers({}),
    queryFn: async () => {
      const res = await apiClient.get<VoucherListResponse>('/admin/billing/vouchers?page=1&perPage=50');
      return res.data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        code,
        description: description || undefined,
        discountType,
        discountValue: Number(discountValue),
        maxDiscountAmount: maxDiscount ? Number(maxDiscount) : undefined,
        minPurchaseAmount: minPurchase ? Number(minPurchase) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
        applicablePlans: plans,
        isActive: true,
      };
      const res = await apiClient.post<{ success: true; data: VoucherRow }>(
        '/admin/billing/vouchers',
        payload,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'admin', 'vouchers'] });
      setCode('');
      setDescription('');
      setDiscountValue('10');
      setMaxDiscount('');
      setMinPurchase('');
      setMaxUses('');
    },
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete<{ success: true; data: VoucherRow }>(
        `/admin/billing/vouchers/${id}`,
      );
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing', 'admin', 'vouchers'] }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Vouchers</h1>
        <p className="text-sm text-muted-foreground">
          Create promotional codes your businesses can redeem at checkout.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New voucher
          </CardTitle>
          <CardDescription>Codes are uppercase and unique.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="WELCOME10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div>
              <Label htmlFor="dtype">Discount type</Label>
              <select
                id="dtype"
                className="rounded-md border px-3 py-2 text-sm w-full"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed amount</option>
              </select>
            </div>
            <div>
              <Label htmlFor="dvalue">
                {discountType === 'PERCENTAGE' ? 'Percentage' : 'Amount (BDT)'}
              </Label>
              <Input
                id="dvalue"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="maxd">Max discount (BDT)</Label>
              <Input
                id="maxd"
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="optional"
              />
            </div>
            <div>
              <Label htmlFor="minp">Min purchase (BDT)</Label>
              <Input
                id="minp"
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="optional"
              />
            </div>
            <div>
              <Label htmlFor="mu">Max redemptions</Label>
              <Input
                id="mu"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="unlimited"
              />
            </div>
            <div>
              <Label htmlFor="vf">Valid from</Label>
              <Input
                id="vf"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="vu">Valid until</Label>
              <Input
                id="vu"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-3">
              <Label>Applicable plans</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {ALL_PLANS.map((p) => {
                  const checked = plans.includes(p);
                  return (
                    <label
                      key={p}
                      className={`cursor-pointer rounded-md border px-3 py-1 text-sm ${
                        checked ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mr-1"
                        checked={checked}
                        onChange={() =>
                          setPlans((prev) =>
                            checked ? prev.filter((x) => x !== p) : [...prev, p],
                          )
                        }
                      />
                      {p}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="optional internal note"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={create.isPending || !code}>
                {create.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4" />
                )}
                Create voucher
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active vouchers</CardTitle>
          <CardDescription>{data?.meta?.total ?? 0} codes total.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : data?.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2">Code</th>
                    <th className="py-2">Discount</th>
                    <th className="py-2">Used</th>
                    <th className="py-2">Plans</th>
                    <th className="py-2">Validity</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((v) => (
                    <tr key={v.id} className="border-t">
                      <td className="py-2 font-mono font-medium">{v.code}</td>
                      <td className="py-2">
                        {v.discountType === 'PERCENTAGE'
                          ? `${v.discountValue}%`
                          : `${v.discountValue} BDT`}
                      </td>
                      <td className="py-2">
                        {v.usedCount}
                        {v.maxUses !== null ? ` / ${v.maxUses}` : ''}
                      </td>
                      <td className="py-2">{v.applicablePlans.join(', ')}</td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {formatDate(v.validFrom)} → {formatDate(v.validUntil)}
                      </td>
                      <td className="py-2">
                        {v.isActive ? (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deactivate.mutate(v.id)}
                          disabled={!v.isActive || deactivate.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Deactivate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No vouchers yet — create one above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}