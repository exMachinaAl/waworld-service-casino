# WA-WORLD 3.4.0 integration guide (non-destructive preview)

**Status:** preview only. The original `WA-WORLD-Starter.zip` is not modified.

## Safe preparation

1. Run WORLD Arcade Engine locally and generate `.env` with `INSTALL.bat`.
2. Copy `integrations/wa-world/adapter.mjs` into the bot at `src/integrations/wae-adapter.mjs` (create folder if missing).
3. Add three configuration variables to the **bot's private `.env`**, not a tracked repository file: `WAE_URL=http://127.0.0.1:8787`, `WAE_PUBLIC_URL=http://127.0.0.1:8787`, `WAE_SERVICE_TOKEN=<same-key-from-WAE-env>`.
4. In `src/wa/gateway.js`, import `createWorldArcadeAdapter` from `../integrations/wae-adapter.mjs`, instantiate it only when `process.env.WAE_SERVICE_TOKEN` is set, and pass the instance to `createWhatsAppHandler({ ...,waeAdapter })`.
5. In `src/wa/handler.js`, add optional `waeAdapter=null` to `createWhatsAppHandler` destructured arguments. After the existing `const cmd=parsed.text.trim();` line, before group menu handling, add:

```js
if (/^\.wae(?:\s|$)/i.test(cmd)) {
  if (!waeAdapter) {
    await sendText(jid,'WORLD Arcade belum terhubung.',msg);
    return {ok:false,action:'wae-not-configured'};
  }
  const result=await waeAdapter.handle({
    senderJid:sender,
    text:cmd,
    isGroup,
    messageId:eventKey
  });
  if(result)await sendText(jid,result,msg);
  return {ok:true,action:'wae-native'};
}
```

**Safety note:** this must be after existing `allowSender(...)` checks and `parseIncoming` validation, preserving their security policy. Send all `.wae` account and wallet actions only via DM. Preserve old `.arcade`, `.slot`, `.bj`, and VCUR command routing unchanged. This is an additive integration, not cutover.

## How to test

From the bot's DM: `.wae profile`, `.wae slot 10`, `.wae spin`, `.wae web`, then open the private link in the browser. After the browser claims the request, send `.wae pending` and match the displayed codes, then `.wae approve REF CODE`; finish in the browser. `WAE_PUBLIC_URL` must be an HTTPS public origin when deployed off-device.

The **existing WA-WORLD economy never receives writes** from the adapter. Rewards from WAE only affect ACR in WAE's database.

## Limitations

- Bot remains under its existing Baileys reliability/account restrictions.
- MVP uses `.wae` text commands; native buttons are a future stage.
- Deep link is for localhost testing unless configured with TLS domain.
- No automatic 2-way notification push for bot yet: the bot uses `.wae status` to refresh and `.wae pending` for confirmation. Browser state SSE is already implemented.
- The WA connector consumes only verified `senderJid` from the bot's parsed message context; it must not accept user-written JIDs.
- Changes in WA-WORLD source may need review before application. Do not run a blind search/replace on another version.
