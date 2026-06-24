# Lipaxe Mobile Docs - Business All, Notifications et Push

Cette documentation donne au développeur mobile les contrats à utiliser pour le module Business All, les notifications applicatives et les push notifications.

## 1. Configuration API

Base URL production:

```txt
https://api.lipaxe.com/api/v1
```

Headers communs:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept-Language: fr | en | ln
```

Le mobile doit envoyer `Accept-Language` selon la langue configurée par l'utilisateur. Les valeurs attendues sont:

```txt
fr = français
en = anglais
ln = lingala
```

## 2. Validation PIN

Toute action qui déplace de l'argent doit demander le PIN avant d'appeler l'endpoint métier.

Endpoint:

```http
POST /auth/verify-pin/
```

Payload:

```json
{
  "pin": "12345"
}
```

Réponse attendue:

```json
{
  "valid": true
}
```

Si `valid` n'est pas `true`, le mobile ne doit pas envoyer l'action métier.

Actions qui doivent demander le PIN:

- Contribution Business All / tontine.
- Achat, retrait, recharge, échange, transfert ou paiement.
- Toute opération qui débite un wallet.

Actions qui ne nécessitent pas forcément le PIN:

- Lire les groupes.
- Inviter un membre.
- Relancer les membres.
- Lire les notifications.

## 3. Business All

Business All v1 côté mobile couvre les groupes/tontines. Le groupe permet à un utilisateur de créer un pot collectif, inviter des membres, recevoir des contributions, gérer l'ordre de bénéficiaires et envoyer des rappels.

### 3.1 Modèle Tontine

```ts
type TontineStatus =
  | "pending"
  | "draft"
  | "active"
  | "locked"
  | "completed"
  | "cancelled"
  | "defaulted";

type TontineFrequency = "weekly" | "monthly";
type TontineSelection = "random" | "ordered" | "credit_score";
```

Structure principale:

```json
{
  "id": "uuid",
  "name": "Tontine famille",
  "contribution": 10000,
  "currency": "CDF",
  "frequency": "weekly",
  "duration_months": 6,
  "selection": "ordered",
  "status": "pending",
  "members": [
    {
      "user": "LI0918106542",
      "received": false,
      "position": 1,
      "status": "invited",
      "credit_score_snapshot": 80,
      "kyc_status_snapshot": "verified"
    }
  ],
  "next_beneficiary": "LI0918106542",
  "next_payout_at": "2026-06-30T10:00:00Z",
  "my_join_status": "accepted",
  "owner_account": "LI202029816",
  "is_owner": true,
  "escrow_wallet_id": "uuid",
  "treasury_wallet_id": "uuid",
  "max_members": 12,
  "min_credit_score": 50,
  "require_kyc_verified": true,
  "invite_only": true,
  "payout_commission_percent": "1.5",
  "reserve_percent": "5"
}
```

### 3.2 Lister les groupes

```http
GET /tontines/
```

Utilisation mobile:

- Afficher les groupes où l'utilisateur est propriétaire ou membre.
- Afficher clairement le statut: `draft`, `pending`, `active`, `locked`, `completed`, `cancelled`, `defaulted`.
- Si le groupe est en attente, permettre d'ajouter d'autres membres et de renvoyer des invitations.

### 3.3 Créer un groupe

```http
POST /tontines/
```

Payload:

```json
{
  "name": "Tontine famille",
  "contribution": 10000,
  "currency": "CDF",
  "frequency": "weekly",
  "duration_months": 6,
  "selection": "ordered",
  "members": ["client@email.com", "LI0918106542"],
  "max_members": 12,
  "min_credit_score": 50,
  "require_kyc_verified": true,
  "invite_only": true,
  "payout_commission_percent": 1.5,
  "reserve_percent": 5,
  "escrow_wallet_id": "uuid",
  "treasury_wallet_id": "uuid",
  "policy": {
    "late_payment_grace_days": 2,
    "allow_member_replacement": true
  }
}
```

Champs importants:

- `members`: accepte des emails ou des `account_no`.
- `frequency`: `weekly` ou `monthly`.
- `selection`: `random`, `ordered` ou `credit_score`.
- `require_kyc_verified`: si `true`, seuls les membres KYC vérifiés doivent participer.

Règles UX:

- Ne pas accepter une contribution à `0`.
- Ne pas créer un groupe sans nom.
- Vérifier que chaque membre est soit un email valide, soit un account number Lipaxe.
- Après création, rafraîchir `/tontines/` et `/auth/notifications/`.

### 3.4 Modifier un groupe

```http
PATCH /tontines/{tontine_id}/
```

Payload partiel:

```json
{
  "name": "Tontine business",
  "contribution": 25000,
  "frequency": "monthly",
  "duration_months": 12,
  "max_members": 20
}
```

Le mobile doit permettre l'édition si:

- L'utilisateur est propriétaire/admin du groupe.
- Le groupe n'est pas verrouillé ou terminé.

### 3.5 Ajouter ou inviter des membres

```http
POST /tontines/{tontine_id}/members/
```

Payload:

```json
{
  "members": ["client@email.com", "LI0918106542"]
}
```

Réponse attendue:

```json
{
  "detail": "Membres invités",
  "added": ["client@email.com", "LI0918106542"],
  "tontine": {}
}
```

Règles mobile:

- L'utilisateur peut ajouter des membres après création, même si le groupe n'est pas encore opérationnel.
- Afficher le statut de chaque invitation: invité, accepté, refusé, en attente.
- Les membres peuvent être ajoutés par email ou account number.

### 3.6 Relancer les membres

```http
POST /tontines/{tontine_id}/reminders/
```

Réponse:

```json
{
  "detail": "Rappels envoyés",
  "notified": ["LI0918106542", "client@email.com"]
}
```

Usage mobile:

- Afficher un bouton "Relancer les membres".
- Ne pas spammer: désactiver temporairement le bouton après envoi.
- Rafraîchir les notifications après succès.

### 3.7 Accepter ou refuser une invitation

```http
POST /tontines/invitations/decision/
```

Payload:

```json
{
  "tontine_id": "uuid",
  "action": "accept"
}
```

Pour refuser:

```json
{
  "tontine_id": "uuid",
  "action": "reject"
}
```

Réponse:

```json
{
  "detail": "Invitation mise à jour",
  "tontine_status": "pending",
  "join_status": "accepted",
  "member_status": "active",
  "accepted_contract": true
}
```

### 3.8 Vérifier l'éligibilité

```http
GET /tontines/{tontine_id}/eligibility/
```

Réponse:

```json
{
  "eligible": true,
  "score": 80,
  "kyc_status": "verified",
  "policy": {},
  "reasons": []
}
```

Usage mobile:

- Appeler avant de proposer l'acceptation ou la contribution.
- Afficher les raisons si `eligible = false`.

### 3.9 Contribuer au groupe

```http
POST /tontines/contribute/
```

Payload:

```json
{
  "tontine_id": "uuid",
  "wallet_id": "uuid",
  "amount": 10000
}
```

Règles mobile:

- Demander le PIN avant l'appel.
- Vérifier le solde local du wallet sélectionné.
- Si le solde est insuffisant, ne pas appeler le backend.
- Après succès, rafraîchir `/wallets/`, `/tontines/`, `/transactions/` et `/auth/notifications/`.

## 4. Notifications applicatives

### 4.1 Lister les notifications

```http
GET /auth/notifications/
```

Structure normalisée côté mobile:

```json
{
  "id": "uuid",
  "title": "Vous avez retiré avec Orange Money",
  "body": "Votre retrait de 50 USD est complété.",
  "level": "success",
  "priority": "normal",
  "read": false,
  "createdAt": "2026-06-19T10:00:00Z",
  "link": "/app/transactions/uuid",
  "logo": "https://api.lipaxe.com/media/payment-methods/orange.png",
  "kind": "transaction",
  "paymentMethodName": "Orange Money",
  "paymentMethodLogo": "https://api.lipaxe.com/media/payment-methods/orange.png",
  "provider": "pawapay",
  "amount": 50,
  "currency": "USD",
  "transactionId": "uuid"
}
```

Champs importants:

- `title`: titre déjà localisé.
- `body`: message déjà localisé.
- `paymentMethodName`: nom humain du moyen de paiement.
- `paymentMethodLogo`: logo du moyen de paiement.
- `transactionId`: utilisé pour ouvrir la page détail transaction.
- `link`: route cible.

### 4.2 Marquer une notification comme lue

```http
POST /auth/notifications/makeasread/
```

Payload principal:

```json
{
  "id": "notification_id"
}
```

Payloads alternatifs tolérés côté web:

```json
{ "notification_id": "notification_id" }
```

```json
{ "_id": "notification_id" }
```

### 4.3 Règles d'affichage mobile

Priorité du logo:

1. `paymentMethodLogo`
2. `logo`
3. logo provider
4. logo currency
5. fallback Lipaxe

Affichage du signe:

- `+` pour dépôt, reçu, crédit, remboursement reçu.
- `-` pour retrait, transfert envoyé, achat carte, recharge carte, swap débité, paiement facture.

Navigation:

- Si `transactionId` existe, ouvrir la page détail transaction.
- Sinon si `link` existe, mapper le lien web vers la route mobile équivalente.
- Sinon ouvrir le centre de notifications.

## 5. Push notifications Expo Mobile

Le mobile Expo doit utiliser uniquement des tokens Expo.

Formats valides:

```txt
ExpoPushToken[xxxxxxxx]
ExponentPushToken[xxxxxxxx]
```

Ne jamais envoyer un endpoint navigateur ou FCM web dans le champ token Expo.

### 5.1 Enregistrer l'appareil

Endpoint:

```http
POST /auth/devices/register/
```

Payload recommandé:

```json
{
  "device_id": "ios-device-uuid",
  "label": "iPhone 15 Pro",
  "platform": "ios",
  "push_provider": "expo",
  "push_token": "ExpoPushToken[xxxxxxxx]",
  "app_version": "1.0.0"
}
```

Android:

```json
{
  "device_id": "android-device-uuid",
  "label": "Samsung Galaxy",
  "platform": "android",
  "push_provider": "expo",
  "push_token": "ExpoPushToken[xxxxxxxx]",
  "app_version": "1.0.0"
}
```

Notes:

- `device_id` doit rester stable par installation.
- Réenregistrer le device après login.
- Réenregistrer si Expo retourne un nouveau token.
- Ne pas envoyer de push token si l'utilisateur refuse la permission.

### 5.2 Payload push attendu

```json
{
  "title": "Retrait complété",
  "body": "Vous avez retiré 50 USD avec Orange Money.",
  "data": {
    "id": "notification_uuid",
    "kind": "transaction",
    "transaction_id": "transaction_uuid",
    "link": "/app/transactions/transaction_uuid",
    "payment_method_name": "Orange Money",
    "payment_method_logo": "https://api.lipaxe.com/media/payment-methods/orange.png",
    "amount": "50.00",
    "currency": "USD",
    "direction": "out"
  }
}
```

### 5.3 Comportement mobile

Au démarrage après login:

1. Demander permission notification.
2. Obtenir le token Expo.
3. Enregistrer le device via `/auth/devices/register/`.
4. Charger `/auth/notifications/`.

Quand une notification arrive en foreground:

- Afficher une bannière locale.
- Rafraîchir `/auth/notifications/`.
- Si `kind = transaction`, rafraîchir aussi `/transactions/` et `/wallets/`.

Quand l'utilisateur clique une notification:

- Ouvrir la route depuis `data.link`.
- Si `data.transaction_id` existe, ouvrir la page détail transaction.

## 6. Web Push navigateur

Le web n'utilise pas Expo. Il utilise Web Push avec VAPID.

### 6.1 Récupérer la clé VAPID

```http
GET /auth/push/vapid-key/
```

Réponse:

```json
{
  "public_key": "B..."
}
```

### 6.2 S'abonner au push web

```http
POST /auth/push/subscribe/
```

Payload:

```json
{
  "device_id": "browser-device-id",
  "label": "Chrome Windows",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

### 6.3 Se désabonner

```http
POST /auth/push/unsubscribe/
```

Payload:

```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

## 7. Différence importante entre Expo et Web Push

| Plateforme | Type de token | Endpoint backend |
| --- | --- | --- |
| Mobile Expo iOS/Android | `ExpoPushToken[...]` | `/auth/devices/register/` |
| Web navigateur | `PushSubscription.endpoint` + keys | `/auth/push/subscribe/` |

Erreur à éviter:

```txt
Invalid push token
```

Cette erreur arrive quand un token navigateur est envoyé comme token Expo, ou quand le token Expo n'a pas le bon format.

## 8. Notifications transactionnelles

Les notifications transactionnelles doivent toujours inclure:

```json
{
  "kind": "transaction",
  "transaction_id": "uuid",
  "payment_method_name": "Airtel CDF",
  "payment_method_logo": "https://...",
  "amount": "10000.00",
  "currency": "CDF",
  "direction": "out"
}
```

Exemples de titres attendus:

- `Vous avez déposé avec Airtel Money`
- `Vous avez retiré avec Orange Money`
- `Vous avez transféré à Rodrigue Maheshe`
- `Vous avez acheté une carte virtuelle`
- `Vous avez rechargé votre carte virtuelle`
- `Vous avez retiré depuis votre carte virtuelle`
- `Votre contribution Business All est confirmée`
- `Vous avez reçu une invitation Business All`

## 9. Rafraîchissement conseillé après actions

Après une action Business All:

- `/tontines/`
- `/wallets/`
- `/transactions/`
- `/auth/notifications/`

Après une notification transactionnelle reçue:

- `/auth/notifications/`
- `/transactions/`
- `/wallets/`

Après enregistrement push:

- `/auth/devices/`
- `/auth/notifications/`

