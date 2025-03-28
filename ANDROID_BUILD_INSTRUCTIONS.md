# راهنمای ساخت فایل APK برای اپلیکیشن حسابداری

## نیازمندی‌ها

برای ساخت فایل APK از پروژه، به موارد زیر نیاز دارید:

1. **Android Studio**: نسخه آخر Android Studio را از [سایت رسمی](https://developer.android.com/studio) دانلود و نصب کنید.
2. **JDK (Java Development Kit)**: Android Studio معمولاً همراه با JDK نصب می‌شود.
3. **Gradle**: Android Studio به صورت خودکار Gradle را مدیریت می‌کند.

## مراحل ساخت APK

### مرحله 1: استخراج فایل‌های پروژه اندروید

1. فایل `accounting-android-project.zip` را به سیستم خود دانلود کنید.
2. این فایل را در یک پوشه جدید استخراج کنید.

### مرحله 2: باز کردن پروژه در Android Studio

1. Android Studio را اجرا کنید.
2. گزینه "Open an existing Android Studio project" را انتخاب کنید.
3. به پوشه‌ای که فایل‌های استخراج شده در آن قرار دارند، بروید و پوشه را انتخاب کنید.
4. منتظر بمانید تا Android Studio پروژه را بارگذاری و همگام‌سازی کند.

### مرحله 3: تنظیمات امضای APK (اختیاری اما توصیه می‌شود)

برای انتشار اپلیکیشن در Google Play Store، نیاز به امضای دیجیتال APK دارید:

1. از منوی Android Studio، به `Build > Generate Signed Bundle / APK` بروید.
2. گزینه APK را انتخاب کنید.
3. اگر کلید ذخیره‌سازی دارید، آن را انتخاب کنید؛ در غیر این صورت، با کلیک روی "Create new..." یک کلید جدید ایجاد کنید.
4. اطلاعات لازم را پر کنید و یک رمز عبور امن انتخاب کنید.
5. نوع نسخه را انتخاب کنید (release توصیه می‌شود).
6. روی "Finish" کلیک کنید.

### مرحله 4: ساخت APK بدون امضا (ساده‌تر)

اگر فقط می‌خواهید یک APK برای تست داشته باشید:

1. از منوی Android Studio، به `Build > Build Bundle(s) / APK(s) > Build APK(s)` بروید.
2. منتظر بمانید تا فرآیند ساخت تکمیل شود.
3. زمانی که ساخت APK تکمیل شد، نوتیفیکیشنی در پایین صفحه نمایش داده می‌شود با گزینه "locate" که می‌توانید روی آن کلیک کنید تا فایل APK را پیدا کنید.

### مرحله 5: نصب APK روی دستگاه

1. فایل APK را به دستگاه اندروید خود منتقل کنید.
2. در دستگاه اندروید، روی فایل APK کلیک کنید تا نصب شود.
3. ممکن است لازم باشد تنظیمات امنیتی دستگاه را تغییر دهید تا اجازه نصب از منابع ناشناس را بدهید.

## عیب‌یابی

### مشکلات رایج و راه‌حل‌ها

1. **خطای Gradle**: اگر با خطای Gradle مواجه شدید، مطمئن شوید که Android Studio را به آخرین نسخه به‌روزرسانی کرده‌اید و اینترنت شما متصل است تا فایل‌های لازم دانلود شوند.

2. **خطای Build Tools**: اگر پیغامی مبنی بر نبود Build Tools دریافت کردید، به SDK Manager بروید (Tools > SDK Manager) و بخش SDK Tools را باز کنید و مطمئن شوید که Android SDK Build-Tools نصب شده است.

3. **مشکلات منابع**: اگر با خطاهای مربوط به منابع (resources) مواجه شدید، سعی کنید پروژه را همگام‌سازی (Sync) کنید: `File > Sync Project with Gradle Files`.

## نکات مهم

- این APK از برنامه وب که با React و Express.js توسعه یافته است، استفاده می‌کند و آن را در یک نمای WebView در اندروید نمایش می‌دهد.
- برای کارکرد کامل اپلیکیشن، لازم است سرور Express.js در دستگاه اندروید اجرا شود. در حالت پیش‌فرض، اپلیکیشن به صورت آفلاین عمل می‌کند و اطلاعات را در حافظه ذخیره می‌کند.
- برای استفاده از قابلیت‌های پشتیبان‌گیری و همگام‌سازی با Google Drive، نیاز به تنظیم کلیدهای API مربوط به Google در اپلیکیشن دارید.

## تنظیمات پیش‌فرض

اپلیکیشن با تنظیمات زیر پیکربندی شده است:

- نام پکیج: `com.accounting.app`
- نسخه: 1.0.0
- SDK هدف: Android 14 (API Level 34)
- حداقل SDK: Android 8.0 (API Level 26)