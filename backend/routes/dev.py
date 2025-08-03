from fastapi import APIRouter
from testing import listing_finder
from testing import property_extractor

router = APIRouter()

@router.get("/run-listing-finder-test")
def run_listing_finder_test():
    return listing_finder.run_tests()

@router.get("/run-property-extractor-test")
def run_property_extractor_test():
    return property_extractor.run_tests()
