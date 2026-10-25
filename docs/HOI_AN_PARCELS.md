# Hoi An parcel survey — 2026-10-25

Research preceded implementation (ADR-107). The references guide original 3D geometry; no Google
image, panorama, tile, mesh or photograph is shipped as a texture, background or reconstructed asset.
Task screenshots retain the provider/photographer/date overlays in the task visualization folder.

## Observed imagery

| Reference opened in Google Maps | Date shown by viewer | Observations used |
|---|---|---|
| [Chua Cau panorama](https://www.google.com/maps/@?api=1&map_action=pano&pano=CIHM0ogKEICAgIDfq-_ZgwE) | Captured December 2024; contributor panel January 2025 | Attached yellow street elevations, narrow stone walks, masonry-lined tributary, shop-house backs beside water. This is community 360 imagery, not a surveyed map or continuous Google driving route. |
| [Tan Ky interior panorama](https://www.google.com/maps/@?api=1&map_action=pano&pano=CIHM0ogKEICAgID4x_jmlgE) | May 2018 | Timber partition/frame, tall interior, daylight openings and a separate service threshold. Older reference for construction language, not a claim about current furnishings. |
| Chua Cau photograph opened from Maps place photos | March 2023 | Pre-restoration bridge reference only; not used to assert present paint colours. |

The viewer also reports limited local Street View coverage. No complete street-by-street or
present-day cadastral survey is claimed. Public attraction coordinates locate references only;
game parcels never store them or claim corresponding geographic area.

## Documentary cross-check

- [Hoi An Heritage Centre: Nha Pho](https://hoianheritage.danang.gov.vn/vi/di-san-van-hoa/Nha-pho/nha-pho-261.html)
  describes deep shop-house sequences: trading space, intermediate light well and connecting
  galleries, rear storage/living space and service yard/access. Parallel historic streets form
  the frontage system. This supports elongated lots and separate roofed volumes, not square towers.
- [Tan Ky, official heritage portal](https://www.hoianworldheritage.org.vn/vi/paper/detail/Nha-co-Tan-Ky-diem-dung-chan-thu-vi-o-Hoi-An-3.hwh)
  describes the Nguyen Thai Hoc trading entrance and Bach Dang riverside goods access. Its plan
  therefore has a front shop, open courtyard and distinct rear service doorway in the new kit.
- [Quang Trieu monument record](https://hoianheritage.net/uploads/download/hq-05-hoi-quan-quang-dong.pdf)
  describes a substantially larger compound with frontage on Tran Phu, deep development, broad
  forecourt and lateral/rear halls. Its recorded approximate area is historical documentation,
  not a live cadastral measurement. The game uses a larger footprint but no square-metre claim.
- [Chua Cau, official tourism portal](https://danangfantasticity.com/en/kien-truc/chua-cau)
  supports an actual covered creek crossing with attached shrine. New bridge sites are exclusively
  across the existing water corridor; land plans cannot cover it.

## What is inferred for the game

`engine/parcels.js` freezes version-1 proportions per blueprint. Width/depth are game world units,
not metres or measured replicas. District street axes express relative geography; the earned city
is an evolving personal settlement, distinct from the read-only full regional study.

Old-town frontage zones also keep Tan Ky/Quang Trieu east of the reference crossing and
Phung Hung/Cam Pho on its west side, without rebasing any historical house. These remain relative
game zones, not a surveyed monument map.

New `workVersion: 2` plans persist exact parcel dimensions, district, centre and orientation.
They reuse completed-focus-minute accounting and existing catalog costs. Version-1/unversioned
plans retain the old grid replay. Collision checks include historical buildings and water;
conservative legacy-cell reservations protect later older-style placement. Shared reservations
are reference-counted so cancelling one parcel cannot expose a neighbouring building to overlap.

Google reference screenshots remain outside the app repository. Source notes, dates, limitations
and original procedural geometry are reproducible without a Google API key or external image load.
