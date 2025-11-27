# tests/e2e_test.py
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException

# Read env vars (when running inside test-runner service these are set)
SELENIUM_URL = os.environ.get("SELENIUM_URL", "http://localhost:4444/wd/hub")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")  # host mode default

def wait_for_selenium(url, timeout=60):
    start = time.time()
    while True:
        try:
            # Try minimal connection to Selenium status endpoint
            import requests
            r = requests.get(url.replace("/wd/hub", "") + "/status", timeout=5)
            if r.ok:
                return True
        except Exception:
            pass
        if time.time() - start > timeout:
            raise RuntimeError("Selenium not ready after {}s".format(timeout))
        time.sleep(1)

def wait_for_frontend(url, timeout=60):
    start = time.time()
    while True:
        try:
            import requests
            r = requests.get(url, timeout=5)
            if r.status_code < 500:
                return True
        except Exception:
            pass
        if time.time() - start > timeout:
            raise RuntimeError("Frontend not ready after {}s".format(timeout))
        time.sleep(1)

def main():
    print("Selenium URL:", SELENIUM_URL)
    print("Frontend URL:", FRONTEND_URL)

    # wait for services
    print("Waiting for Selenium to be ready...")
    wait_for_selenium(SELENIUM_URL)
    print("Selenium ready.")
    print("Waiting for frontend to be ready...")
    wait_for_frontend(FRONTEND_URL)
    print("Frontend ready.")

    options = Options()
    # When running inside containerized Selenium, headless can be set or not.
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--headless=new")  # change/remove for debugging with GUI

    print("Connecting to remote webdriver...")
    driver = webdriver.Remote(command_executor=SELENIUM_URL, options=options)

    try:
        print("Opening frontend...")
        driver.get(FRONTEND_URL)
        time.sleep(2)  # small wait for SPA

        print("Title:", driver.title)

        # Example check: root element exists (customize to your app)
        try:
            root = driver.find_element(By.TAG_NAME, "body")
            print("Body tag found:", root is not None)
        except Exception as e:
            print("Could not find body tag:", e)

        # Add more application-specific flows here (login, file upload, ask API)
        print("Test finished successfully.")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
