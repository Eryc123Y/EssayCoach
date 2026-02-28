from ninja import Router

from .routers.classes import router as classes_router
from .routers.dashboard import router as dashboard_router
from .routers.rubrics import router as rubrics_router
from .routers.submissions import router as submissions_router
from .routers.tasks import router as tasks_router
from .routers.units import router as units_router
from .routers.users import router as users_router

router = Router()
router.add_router("", dashboard_router)
router.add_router("", users_router)
router.add_router("", classes_router)
router.add_router("", tasks_router)
router.add_router("", rubrics_router)
router.add_router("", submissions_router)
router.add_router("", units_router)
