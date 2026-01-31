from playwright.sync_api import sync_playwright
import sys


def run():
    with sync_playwright() as p:
        print("Launching Chromium...")
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"{msg.type}: {msg.text}"))

        # Capture schema response status
        schema_info = {"status": None, "url": None}

        def handle_response(response):
            # Print all requests to debug
            print(f"Request: {response.status} {response.url}")

            if "openapi-schema.json" in response.url or "openapi.json" in response.url:
                schema_info["status"] = response.status
                schema_info["url"] = response.url
                print(f"CAPTURED SCHEMA: {response.status} from {response.url}")

        page.on("response", handle_response)

        target_url = "http://127.0.0.1:8001/EssayCoach/api-reference/swagger-ui/"
        print(f"Navigating to {target_url}...")

        try:
            page.goto(target_url, wait_until="networkidle")
        except Exception as e:
            print(f"Error navigating: {e}")
            browser.close()
            return

        print("Waiting for operations list (.opblock) to appear...")
        try:
            # Wait specifically for the operation block which indicates Swagger loaded the spec
            page.wait_for_selector(".opblock", timeout=15000)
            print("Swagger UI operations loaded successfully.")
        except Exception as e:
            print(f"Timeout waiting for .opblock: {e}")
            # Take screenshot anyway to see what's wrong

        screenshot_path = "swagger-ui.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

        # Output Results
        print("\n" + "=" * 30)
        print("RESULTS")
        print("=" * 30)
        print(f"Screenshot: {screenshot_path}")

        if schema_info["status"]:
            print(f"Schema Request Status: {schema_info['status']}")
            if schema_info["status"] == 200:
                print("Schema Request: SUCCESS")
            else:
                print("Schema Request: FAILED")
        else:
            print(
                "Schema Request: NOT DETECTED (It might have loaded before listener or from cache, or failed silently)"
            )

        print("\nConsole Logs:")
        if console_logs:
            for log in console_logs:
                print(f"- {log}")
        else:
            print("No console logs captured.")
        print("=" * 30)


if __name__ == "__main__":
    run()
