import { NextRequest, NextResponse } from 'next/server';
import { normalizeUserInfo } from '@/lib/user-normalization';
import { getServerApiUrl } from '@/lib/server-api';

type AnyRecord = Record<string, any>;

function getErrorMessage(payload: AnyRecord | null, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  return (
    payload.message ||
    payload.detail ||
    payload.error?.message ||
    payload.error ||
    fallback
  );
}

async function fetchCurrentUser(token: string) {
  const apiUrl = getServerApiUrl();
  return fetch(`${apiUrl}/api/v2/core/users/me/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetchCurrentUser(token);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: getErrorMessage(payload, 'Failed to fetch current user') },
        { status: response.status }
      );
    }

    return NextResponse.json(normalizeUserInfo(payload ?? {}));
  } catch (error) {
    console.error(
      '[auth/me GET] Error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as AnyRecord;
    const updatePayload: AnyRecord = {};

    if (typeof body.first_name === 'string') {
      updatePayload.first_name = body.first_name;
    }
    if (typeof body.last_name === 'string') {
      updatePayload.last_name = body.last_name;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const apiUrl = getServerApiUrl();
    const updateResponse = await fetch(`${apiUrl}/api/v2/auth/me/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    });
    const updateResult = await updateResponse.json().catch(() => null);

    if (!updateResponse.ok) {
      return NextResponse.json(
        {
          message: getErrorMessage(
            updateResult,
            'Failed to update current user'
          )
        },
        { status: updateResponse.status }
      );
    }

    const currentUserResponse = await fetchCurrentUser(token);
    const currentUserPayload = await currentUserResponse
      .json()
      .catch(() => null);

    if (currentUserResponse.ok && currentUserPayload) {
      return NextResponse.json(normalizeUserInfo(currentUserPayload));
    }

    const fallbackUser =
      updateResult?.data?.user ??
      updateResult?.user ??
      updateResult?.data ??
      updateResult;

    if (fallbackUser) {
      return NextResponse.json(normalizeUserInfo(fallbackUser));
    }

    return NextResponse.json({ message: 'User updated' });
  } catch (error) {
    console.error(
      '[auth/me PATCH] Error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
