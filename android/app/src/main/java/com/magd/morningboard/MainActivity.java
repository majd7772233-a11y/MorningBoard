package com.magd.morningboard;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Dialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainActivity extends Activity {

    private static final String START_URL =
            "https://majd7772233-a11y.github.io/MorningBoard/";
    private static final String TRUSTED_PAGES_HOST = "majd7772233-a11y.github.io";
    private static final String TRUSTED_ROOM_HOST =
            "spahboard-meeting.ninjascribe.workers.dev";

    private static final int REQUEST_MEDIA_PERMISSIONS = 4101;
    private static final int REQUEST_DOWNLOAD_STORAGE = 4102;
    private static final int REQUEST_FILE_CHOOSER = 4103;

    private WebView webView;
    private FrameLayout rootLayout;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> fileChooserCallback;

    private PermissionRequest pendingMediaRequest;
    private final List<String> pendingMediaResources = new ArrayList<>();

    private String pendingDownloadUrl;
    private String pendingDownloadUserAgent;
    private String pendingDownloadContentDisposition;
    private String pendingDownloadMimeType;

    private final Map<WebView, Dialog> popupDialogs = new HashMap<>();
    private Dialog activePopup;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(11, 15, 25));
        getWindow().setNavigationBarColor(Color.rgb(11, 15, 25));
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        if (Build.VERSION.SDK_INT >= 35) {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        }

        rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.rgb(11, 15, 25));

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return windowInsets;
        });

        webView = new WebView(this);
        configureWebView(webView, true);

        FrameLayout.LayoutParams webParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT);
        rootLayout.addView(webView, webParams);

        progressBar = new ProgressBar(this, null,
                android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setProgress(0);
        progressBar.setProgressTintList(
                android.content.res.ColorStateList.valueOf(Color.rgb(56, 189, 248)));
        progressBar.setIndeterminateTintList(
                android.content.res.ColorStateList.valueOf(Color.rgb(56, 189, 248)));

        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                dp(3),
                Gravity.TOP);
        rootLayout.addView(progressBar, progressParams);
        progressBar.setVisibility(View.GONE);

        setContentView(rootLayout);
        ViewCompat.requestApplyInsets(rootLayout);

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            webView.restoreState(savedInstanceState);
            if (webView.getUrl() == null) {
                webView.loadUrl(START_URL);
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(WebView target, boolean allowPopups) {
        WebSettings settings = target.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(allowPopups);
        settings.setSupportMultipleWindows(allowPopups);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(target, true);

        target.setBackgroundColor(Color.rgb(11, 15, 25));
        target.setOverScrollMode(View.OVER_SCROLL_NEVER);
        target.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

        target.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(
                    WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(Uri.parse(url));
            }

            @Override
            public void onPageStarted(WebView view, String url,
                                     android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (view == webView && progressBar != null) {
                    progressBar.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                CookieManager.getInstance().flush();
                if (view == webView && progressBar != null) {
                    progressBar.setProgress(100);
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request,
                                        WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    if (view == webView && progressBar != null) {
                        progressBar.setVisibility(View.GONE);
                    }
                    Toast.makeText(MainActivity.this,
                            R.string.network_error, Toast.LENGTH_LONG).show();
                }
            }
        });

        target.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                if (view == webView && progressBar != null) {
                    progressBar.setProgress(newProgress);
                    progressBar.setVisibility(
                            newProgress >= 100 ? View.GONE : View.VISIBLE);
                }
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                handleWebPermissionRequest(request);
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingMediaRequest == request) {
                    pendingMediaRequest = null;
                    pendingMediaResources.clear();
                }
            }

            @Override
            public boolean onShowFileChooser(WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                return openFileChooser(callback, params);
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog,
                    boolean isUserGesture, Message resultMsg) {
                if (!allowPopups) {
                    return false;
                }
                return openPopupWindow(resultMsg);
            }

            @Override
            public void onCloseWindow(WebView window) {
                Dialog dialog = popupDialogs.get(window);
                if (dialog != null) {
                    dialog.dismiss();
                }
            }
        });

        target.setDownloadListener((url, userAgent, contentDisposition, mimeType,
                                    contentLength) ->
                beginDownload(url, userAgent, contentDisposition, mimeType));
    }

    private boolean handleNavigation(Uri uri) {
        if (uri == null) {
            return true;
        }

        String scheme = uri.getScheme();
        if (scheme == null
                || "http".equalsIgnoreCase(scheme)
                || "https".equalsIgnoreCase(scheme)
                || "about".equalsIgnoreCase(scheme)
                || "blob".equalsIgnoreCase(scheme)
                || "data".equalsIgnoreCase(scheme)) {
            return false;
        }

        try {
            Intent intent;
            if ("tel".equalsIgnoreCase(scheme)) {
                intent = new Intent(Intent.ACTION_DIAL, uri);
            } else if ("mailto".equalsIgnoreCase(scheme)) {
                intent = new Intent(Intent.ACTION_SENDTO, uri);
            } else if ("intent".equalsIgnoreCase(scheme)) {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                intent.setComponent(null);
            } else {
                intent = new Intent(Intent.ACTION_VIEW, uri);
            }

            startActivity(intent);
            return true;
        } catch (Exception exception) {
            Toast.makeText(this, "لا يوجد تطبيق مناسب لفتح هذا الرابط.",
                    Toast.LENGTH_SHORT).show();
            return true;
        }
    }

    private boolean openPopupWindow(Message resultMsg) {
        WebView popup = new WebView(this);
        configureWebView(popup, false);

        FrameLayout popupLayout = new FrameLayout(this);
        popupLayout.setBackgroundColor(Color.rgb(11, 15, 25));
        popupLayout.addView(popup, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        TextView closeButton = new TextView(this);
        closeButton.setText("إغلاق  ×");
        closeButton.setTextColor(Color.WHITE);
        closeButton.setTextSize(13);
        closeButton.setGravity(Gravity.CENTER);
        closeButton.setPadding(dp(12), dp(8), dp(12), dp(8));
        closeButton.setBackgroundColor(Color.rgb(30, 41, 59));

        FrameLayout.LayoutParams closeParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.END);
        closeParams.setMargins(dp(8), dp(8), dp(8), dp(8));
        popupLayout.addView(closeButton, closeParams);

        Dialog dialog = new Dialog(this,
                android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        dialog.setContentView(popupLayout);
        dialog.setOnDismissListener(ignored -> {
            popupDialogs.remove(popup);
            if (activePopup == dialog) {
                activePopup = null;
            }
            popup.stopLoading();
            popup.destroy();
        });

        dialog.show();
        Window popupWindow = dialog.getWindow();
        if (popupWindow != null) {
            popupWindow.setLayout(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT);
        }

        closeButton.setOnClickListener(view -> dialog.dismiss());
        popupDialogs.put(popup, dialog);
        activePopup = dialog;

        WebView.WebViewTransport transport =
                (WebView.WebViewTransport) resultMsg.obj;
        transport.setWebView(popup);
        resultMsg.sendToTarget();
        return true;
    }

    private void handleWebPermissionRequest(PermissionRequest request) {
        runOnUiThread(() -> {
            Uri origin = request.getOrigin();
            if (!isTrustedMediaOrigin(origin)) {
                request.deny();
                return;
            }

            if (pendingMediaRequest != null
                    && pendingMediaRequest != request) {
                pendingMediaRequest.deny();
            }

            pendingMediaRequest = request;
            pendingMediaResources.clear();

            List<String> missingPermissions = new ArrayList<>();
            for (String resource : request.getResources()) {
                if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                    pendingMediaResources.add(resource);
                    if (checkSelfPermission(Manifest.permission.CAMERA)
                            != PackageManager.PERMISSION_GRANTED) {
                        addIfMissing(missingPermissions, Manifest.permission.CAMERA);
                    }
                } else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                    pendingMediaResources.add(resource);
                    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                            != PackageManager.PERMISSION_GRANTED) {
                        addIfMissing(missingPermissions,
                                Manifest.permission.RECORD_AUDIO);
                    }
                }
            }

            if (pendingMediaResources.isEmpty()) {
                request.deny();
                pendingMediaRequest = null;
                return;
            }

            if (missingPermissions.isEmpty()) {
                finishPendingMediaRequest();
            } else {
                requestPermissions(
                        missingPermissions.toArray(new String[0]),
                        REQUEST_MEDIA_PERMISSIONS);
            }
        });
    }

    private boolean isTrustedMediaOrigin(Uri origin) {
        if (origin == null || !"https".equalsIgnoreCase(origin.getScheme())) {
            return false;
        }
        String host = origin.getHost();
        return TRUSTED_PAGES_HOST.equalsIgnoreCase(host)
                || TRUSTED_ROOM_HOST.equalsIgnoreCase(host);
    }

    private void addIfMissing(List<String> list, String permission) {
        if (!list.contains(permission)) {
            list.add(permission);
        }
    }

    private void finishPendingMediaRequest() {
        if (pendingMediaRequest == null) {
            return;
        }

        List<String> grantedResources = new ArrayList<>();
        if (pendingMediaResources.contains(
                PermissionRequest.RESOURCE_VIDEO_CAPTURE)
                && checkSelfPermission(Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            grantedResources.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE);
        }
        if (pendingMediaResources.contains(
                PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                && checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED) {
            grantedResources.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE);
        }

        PermissionRequest request = pendingMediaRequest;
        pendingMediaRequest = null;
        pendingMediaResources.clear();

        if (grantedResources.isEmpty()) {
            request.deny();
            Toast.makeText(this, R.string.media_permission_denied,
                    Toast.LENGTH_SHORT).show();
        } else {
            request.grant(grantedResources.toArray(new String[0]));
        }
    }

    private boolean openFileChooser(ValueCallback<Uri[]> callback,
                                    WebChromeClient.FileChooserParams params) {
        if (fileChooserCallback != null) {
            fileChooserCallback.onReceiveValue(null);
        }
        fileChooserCallback = callback;

        try {
            Intent pickerIntent = params.createIntent();
            if (params.getMode()
                    == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) {
                pickerIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            }

            Intent chooser = Intent.createChooser(
                    pickerIntent, getString(R.string.file_picker_title));
            startActivityForResult(chooser, REQUEST_FILE_CHOOSER);
            return true;
        } catch (ActivityNotFoundException | IllegalArgumentException exception) {
            fileChooserCallback = null;
            callback.onReceiveValue(null);
            Toast.makeText(this, "تعذر فتح منتقي الملفات.",
                    Toast.LENGTH_SHORT).show();
            return false;
        }
    }

    private void beginDownload(String url, String userAgent,
                               String contentDisposition, String mimeType) {
        if (TextUtils.isEmpty(url)
                || !(url.startsWith("https://") || url.startsWith("http://"))) {
            Toast.makeText(this,
                    "هذا النوع من التنزيلات غير مدعوم من رابط الصفحة.",
                    Toast.LENGTH_LONG).show();
            return;
        }

        pendingDownloadUrl = url;
        pendingDownloadUserAgent = userAgent;
        pendingDownloadContentDisposition = contentDisposition;
        pendingDownloadMimeType = mimeType;

        if (Build.VERSION.SDK_INT <= 28
                && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                    new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                    REQUEST_DOWNLOAD_STORAGE);
        } else {
            enqueuePendingDownload();
        }
    }

    private void enqueuePendingDownload() {
        if (TextUtils.isEmpty(pendingDownloadUrl)) {
            return;
        }

        try {
            DownloadManager manager =
                    (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            if (manager == null) {
                throw new IllegalStateException("Download service unavailable");
            }

            String fileName = URLUtil.guessFileName(
                    pendingDownloadUrl,
                    pendingDownloadContentDisposition,
                    pendingDownloadMimeType);
            fileName = sanitizeFileName(fileName);

            DownloadManager.Request request =
                    new DownloadManager.Request(Uri.parse(pendingDownloadUrl));
            request.setTitle(fileName);
            request.setDescription("MorningBoard");
            request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS, fileName);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);

            if (!TextUtils.isEmpty(pendingDownloadMimeType)) {
                request.setMimeType(pendingDownloadMimeType);
            }
            if (!TextUtils.isEmpty(pendingDownloadUserAgent)) {
                request.addRequestHeader("User-Agent", pendingDownloadUserAgent);
            }
            String cookie = CookieManager.getInstance().getCookie(pendingDownloadUrl);
            if (!TextUtils.isEmpty(cookie)) {
                request.addRequestHeader("Cookie", cookie);
            }

            manager.enqueue(request);
            Toast.makeText(this, R.string.download_started,
                    Toast.LENGTH_LONG).show();
        } catch (Exception exception) {
            Toast.makeText(this, R.string.download_failed,
                    Toast.LENGTH_LONG).show();
        } finally {
            pendingDownloadUrl = null;
            pendingDownloadUserAgent = null;
            pendingDownloadContentDisposition = null;
            pendingDownloadMimeType = null;
        }
    }

    private String sanitizeFileName(String fileName) {
        if (TextUtils.isEmpty(fileName)) {
            return "MorningBoard-download";
        }
        String safe = fileName.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return TextUtils.isEmpty(safe) ? "MorningBoard-download" : safe;
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_FILE_CHOOSER) {
            if (fileChooserCallback == null) {
                return;
            }

            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                results = WebChromeClient.FileChooserParams.parseResult(
                        resultCode, data);

                if (results == null && data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int index = 0; index < count; index++) {
                        results[index] = data.getClipData()
                                .getItemAt(index).getUri();
                    }
                } else if (results == null && data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }

            fileChooserCallback.onReceiveValue(results);
            fileChooserCallback = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
            String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_MEDIA_PERMISSIONS) {
            finishPendingMediaRequest();
        } else if (requestCode == REQUEST_DOWNLOAD_STORAGE) {
            if (Build.VERSION.SDK_INT <= 28
                    && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    == PackageManager.PERMISSION_GRANTED) {
                enqueuePendingDownload();
            } else {
                pendingDownloadUrl = null;
                Toast.makeText(this, R.string.download_permission_denied,
                        Toast.LENGTH_LONG).show();
            }
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (activePopup != null && activePopup.isShowing()) {
            activePopup.dismiss();
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) {
            webView.saveState(outState);
        }
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        for (Dialog dialog : new ArrayList<>(popupDialogs.values())) {
            if (dialog.isShowing()) {
                dialog.dismiss();
            }
        }
        popupDialogs.clear();
        activePopup = null;

        if (pendingMediaRequest != null) {
            pendingMediaRequest.deny();
            pendingMediaRequest = null;
        }
        if (fileChooserCallback != null) {
            fileChooserCallback.onReceiveValue(null);
            fileChooserCallback = null;
        }
        if (webView != null) {
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
