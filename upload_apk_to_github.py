
#!/usr/bin/env python3
"""
اسکریپت جامع برای ساخت و آپلود فایل APK به GitHub
"""

import os
import sys
import subprocess
import time
from datetime import datetime

def print_header(title):
    """نمایش هدر زیبا برای عملیات"""
    width = 60
    print("\n" + "=" * width)
    print(title.center(width))
    print("=" * width + "\n")

def execute_command(command):
    """اجرای یک دستور و نمایش خروجی آن"""
    try:
        result = subprocess.run(command, shell=True, check=True, text=True, 
                              capture_output=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"❌ خطا در اجرای دستور: {e}")
        print(f"خروجی خطا: {e.stderr}")
        return None

def ensure_github_token():
    """اطمینان از تنظیم توکن GitHub"""
    if not os.environ.get("GITHUB_TOKEN"):
        print_header("تنظیم توکن GitHub")
        print("توکن GitHub پیدا نشد. لطفاً توکن خود را وارد کنید:")
        print("برای ایجاد توکن جدید، به آدرس زیر بروید:")
        print("https://github.com/settings/tokens/new")
        print("حداقل دسترسی‌های مورد نیاز: repo, workflow")
        
        token = input("\nتوکن GitHub را وارد کنید: ").strip()
        if token:
            # تنظیم موقت توکن برای این اجرا
            os.environ["GITHUB_TOKEN"] = token
            
            # پیشنهاد ذخیره دائمی
            save = input("آیا مایل به ذخیره دائمی توکن هستید؟ (y/n): ").strip().lower()
            if save == 'y':
                print("\nبرای ذخیره دائمی توکن در Replit:")
                print("1. در سایدبار روی 🔒 Secrets کلیک کنید")
                print("2. کلید: GITHUB_TOKEN")
                print("3. مقدار: توکن شخصی گیت‌هاب که وارد کردید")
                input("\nبرای ادامه، کلید Enter را فشار دهید...")
            return True
        else:
            print("❌ توکن وارد نشده است. عملیات متوقف شد.")
            return False
    return True

def ensure_github_repo():
    """اطمینان از تنظیم نام مخزن GitHub"""
    if not os.environ.get("GITHUB_REPO") or os.environ.get("GITHUB_REPO") == "username/repo":
        print_header("تنظیم مخزن GitHub")
        print("نام مخزن GitHub تنظیم نشده است. لطفاً نام مخزن را در قالب username/repo وارد کنید:")
        
        repo = input("نام مخزن GitHub (مثال: user/repo): ").strip()
        if repo and "/" in repo:
            # تنظیم موقت نام مخزن برای این اجرا
            os.environ["GITHUB_REPO"] = repo
            
            # پیشنهاد ذخیره دائمی
            save = input("آیا مایل به ذخیره دائمی نام مخزن هستید؟ (y/n): ").strip().lower()
            if save == 'y':
                print("\nبرای ذخیره دائمی نام مخزن در Replit:")
                print("1. در سایدبار روی 🔒 Secrets کلیک کنید")
                print("2. کلید: GITHUB_REPO")
                print("3. مقدار: نام مخزن گیت‌هاب که وارد کردید")
                input("\nبرای ادامه، کلید Enter را فشار دهید...")
            return True
        else:
            print("❌ نام مخزن نامعتبر است. عملیات متوقف شد.")
            return False
    return True

def create_apk():
    """ساخت فایل APK نمونه"""
    print_header("ساخت فایل APK")
    
    # بررسی وجود APK
    bin_dir = "bin"
    apk_path = os.path.join(bin_dir, "accountingapp-debug.apk")
    
    if os.path.exists(apk_path):
        file_age_minutes = (time.time() - os.path.getmtime(apk_path)) / 60
        file_size_mb = os.path.getsize(apk_path) / (1024 * 1024)
        
        print(f"یک فایل APK موجود است:")
        print(f"مسیر: {apk_path}")
        print(f"اندازه: {file_size_mb:.2f} MB")
        print(f"تاریخ ایجاد: {file_age_minutes:.1f} دقیقه پیش")
        
        if file_size_mb < 0.01:  # کمتر از 10 کیلوبایت
            print("⚠️ هشدار: اندازه فایل موجود خیلی کوچک است و ممکن است نامعتبر باشد.")
        
        rebuild = input("آیا مایل به ساخت مجدد فایل APK هستید؟ (y/n): ").strip().lower()
        if rebuild != 'y':
            return apk_path
    
    # ساخت APK جدید
    print("در حال ساخت فایل APK جدید...")
    result = execute_command("python create_apk.py")
    
    if result and os.path.exists(apk_path):
        print("✅ فایل APK با موفقیت ساخته شد.")
        return apk_path
    else:
        print("❌ خطا در ساخت فایل APK.")
        return None

def upload_to_github(apk_path):
    """آپلود فایل APK به GitHub"""
    print_header("آپلود به GitHub")
    
    # بررسی مجدد وجود فایل
    if not os.path.exists(apk_path):
        print(f"❌ خطا: فایل APK در مسیر {apk_path} یافت نشد.")
        return False
    
    # اطمینان از تنظیم توکن و نام مخزن
    if not ensure_github_token() or not ensure_github_repo():
        return False
    
    # نمایش اطلاعات فایل
    file_size_mb = os.path.getsize(apk_path) / (1024 * 1024)
    print(f"فایل APK: {apk_path}")
    print(f"اندازه فایل APK: {file_size_mb:.2f} MB")
    print(f"مخزن: {os.environ.get('GITHUB_REPO')}")
    
    # ایجاد نام تگ منحصر به فرد
    version = datetime.now().strftime("v%Y.%m.%d-%H%M%S")
    os.environ["RELEASE_VERSION"] = version
    print(f"نسخه انتشار: {version}")
    
    # اجرای دستور آپلود
    print("\n📤 در حال آپلود به GitHub...")
    result = execute_command(f"python github_upload.py {apk_path}")
    
    if result and "آپلود با موفقیت انجام شد" in result:
        return True
    else:
        print("❌ خطا در آپلود به GitHub.")
        return False

def main():
    """تابع اصلی برنامه"""
    print_header("فرآیند ساخت و آپلود APK به GitHub")
    
    # ساخت فایل APK
    apk_path = create_apk()
    if not apk_path:
        return
    
    # آپلود به GitHub
    upload_result = upload_to_github(apk_path)
    
    if upload_result:
        print_header("عملیات با موفقیت انجام شد")
        print("✅ فایل APK با موفقیت به GitHub آپلود شد.")
        print(f"نسخه انتشار: {os.environ.get('RELEASE_VERSION', 'نامشخص')}")
        print(f"مخزن: {os.environ.get('GITHUB_REPO', 'نامشخص')}")
    else:
        print_header("عملیات ناموفق بود")
        print("❌ آپلود فایل APK به GitHub با مشکل مواجه شد.")
        print("لطفاً پیام‌های خطا را بررسی کنید و دوباره تلاش نمایید.")

if __name__ == "__main__":
    main()python upload_apk_to_github.py
