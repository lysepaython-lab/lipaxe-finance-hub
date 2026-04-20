import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PaymentMethod } from '@/store/api/platformApi';

export interface DynamicFields {
  phone?: string;
  card_number?: string;
  card_validity?: string;
  destination_address?: string;
  network?: string;
}

interface Props {
  method?: PaymentMethod;
  values: DynamicFields;
  onChange: (patch: Partial<DynamicFields>) => void;
  context: 'deposit' | 'withdraw';
}

/**
 * Renders dynamic fields based on the payment_type.name of the selected method.
 * - Mobile Payment: phone
 * - Bank Transfer (card): card_number + validity
 * - Electronic: nothing extra (provider handles redirect)
 * - Cryptos (withdraw only): destination address + network
 */
export const PaymentMethodFields = ({ method, values, onChange, context }: Props) => {
  if (!method) return null;
  const typeName = method.payment_type?.name || '';

  if (typeName === 'Mobile Payment' || method.type === 'mobile') {
    return (
      <div className="space-y-2">
        <Label>Numéro de téléphone</Label>
        <Input
          inputMode="tel"
          value={values.phone || ''}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+243 ..."
          className="h-11 rounded-xl"
          maxLength={20}
        />
      </div>
    );
  }

  if (typeName === 'Bank Transfer' || method.type === 'card') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2 sm:col-span-2">
          <Label>Numéro de carte</Label>
          <Input
            inputMode="numeric"
            value={values.card_number || ''}
            onChange={(e) =>
              onChange({
                card_number: e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 16)
                  .replace(/(.{4})/g, '$1 ')
                  .trim(),
              })
            }
            placeholder="4242 4242 4242 4242"
            className="h-11 rounded-xl tabular-nums"
          />
        </div>
        <div className="space-y-2">
          <Label>Validité (MM/AA)</Label>
          <Input
            value={values.card_validity || ''}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
              onChange({ card_validity: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v });
            }}
            placeholder="12/27"
            className="h-11 rounded-xl tabular-nums"
            maxLength={5}
          />
        </div>
      </div>
    );
  }

  if (typeName === 'Cryptos' || method.type === 'crypto') {
    if (context === 'withdraw') {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Adresse de destination</Label>
            <Input
              value={values.destination_address || ''}
              onChange={(e) => onChange({ destination_address: e.target.value.trim() })}
              placeholder="TR... ou 0x..."
              className="h-11 rounded-xl font-mono text-sm"
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">
              Vérifiez deux fois — les transactions crypto sont irréversibles.
            </p>
          </div>
        </div>
      );
    }
    // For deposit, the backend returns an address to the user
    return (
      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        Une adresse de dépôt vous sera fournie après confirmation.
      </div>
    );
  }

  // Electronic — nothing extra needed in the form
  return (
    <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
      Vous serez redirigé vers {method.name} pour finaliser le paiement.
    </div>
  );
};
