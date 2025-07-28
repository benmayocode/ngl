from fastapi import APIRouter
from testing import listing_finder

router = APIRouter()

@router.get("/run-listing-finder-test")
def run_listing_finder_test():
    return listing_finder.run_tests()
