package br.com.kielima.wishlist;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.BridgeActivity;

/**
 * O Android entrega o "Compartilhar" nativo (ACTION_SEND) aqui como extras da
 * Intent — não como parâmetros de URL, que é como o PWA (share_target) recebe
 * no navegador. Reaproveitamos a mesma rota lida por stashIncomingClip() em
 * src/clip.ts: montamos a URL do app com os mesmos parâmetros (`text`,
 * `title`) e recarregamos o WebView, para não duplicar nenhuma lógica de
 * parsing entre o app nativo e o PWA.
 *
 * BridgeActivity.onCreate() já chama this.onNewIntent(getIntent()) assim que o
 * bridge fica pronto (ver load() em BridgeActivity), então não é preciso
 * sobrescrever onCreate — só este método já cobre o start a frio e o app
 * já aberto recebendo um novo compartilhamento (launchMode="singleTask").
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShareIntent(intent);
    }

    private void handleShareIntent(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null || text.isEmpty()) return;
        String title = intent.getStringExtra(Intent.EXTRA_SUBJECT);

        String baseUrl = getBridge().getAppUrl();
        Uri.Builder target = Uri.parse(baseUrl).buildUpon().appendQueryParameter("text", text);
        if (title != null && !title.isEmpty()) target.appendQueryParameter("title", title);

        String url = target.build().toString();
        getBridge().getWebView().post(() -> getBridge().getWebView().loadUrl(url));
    }
}
