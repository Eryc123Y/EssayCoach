from __future__ import annotations

from datetime import date

from ninja import Schema
from pydantic import Field

from api_v2.schemas.base import TimestampSchema
from api_v2.types.enums import AnalyticsScope, Granularity, MetricName
from api_v2.types.ids import ClassId, UnitId, UserId


class AnalyticsQueryIn(Schema):
    """Input for querying analytics data."""

    scope: AnalyticsScope = Field(..., description="Scope of analytics query")
    user_id: UserId | None = None
    class_id: ClassId | None = None
    unit_id: UnitId | None = None
    metrics: list[MetricName] = Field(default_factory=list, description="Metrics to retrieve")
    granularity: Granularity = Granularity.WEEKLY
    start_date: date | None = None
    end_date: date | None = None


class DataPoint(Schema):
    """A single data point in a time series."""

    timestamp: date
    value: float


class MetricTimeSeriesOut(Schema):
    """Output for a time series metric."""

    metric: MetricName
    data: list[DataPoint] = Field(default_factory=list)


class AnalyticsReportOut(TimestampSchema):
    """Output for a comprehensive analytics report."""

    scope: AnalyticsScope
    granularity: Granularity
    start_date: date | None = None
    end_date: date | None = None
    summary_stats: dict[MetricName, float] = Field(default_factory=dict)
    time_series: list[MetricTimeSeriesOut] = Field(default_factory=list)
