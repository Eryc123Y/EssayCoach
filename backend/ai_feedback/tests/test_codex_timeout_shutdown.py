"""SDK cancellation must release the blocking notification reader.

The old SDK left a thread waiting on a discarded queue after an async turn
timed out. asyncio.run then never returned, so the durable job stayed running.
Use the real SDK's notification client, without starting Codex or sending data.
The outer process timeout makes that regression a finite test failure.
"""

import subprocess
import sys
import textwrap


def test_cancelled_sdk_notification_does_not_block_event_loop_shutdown():
    code = textwrap.dedent("""
        import asyncio
        from contextlib import suppress
        from openai_codex.async_client import AsyncCodexClient

        async def exercise():
            client = AsyncCodexClient()
            client.register_turn_notifications("timeout-regression")
            waiting = asyncio.create_task(client.next_turn_notification("timeout-regression"))
            await asyncio.sleep(0.05)
            waiting.cancel()
            client.unregister_turn_notifications("timeout-regression")
            with suppress(asyncio.CancelledError):
                await waiting

        asyncio.run(exercise())
        print("shutdown completed")
    """)
    completed = subprocess.run(
        [sys.executable, "-c", code], capture_output=True, text=True, timeout=5, check=True,
    )
    assert completed.stdout.strip() == "shutdown completed"
