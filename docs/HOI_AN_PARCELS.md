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


## Phung Hung follow-up — 2026-10-26 (before model changes)

Opened Google Maps at the monument (15.8771915,108.3258009). Its Street View entry first
opened an ordinary interior photograph: Hop To, April 2023. The pano API resolved community
panorama `CIHM0ogKEICAgIDMrYv_gAE`, Celine Sais, January 2020, but the image is distorted and
Maps reports no continuous Street View coverage. Do not infer dimensions from that panorama.
A separate place-gallery photograph by Ping Jeng shows a street of attached two-storey timber
frontages: capture label August 2026, contributor panel September 2026, photo ID
`CIABIhDhtttlI0IbiMai8NSq00rr`. Observe frontage continuity, dark shutters, tiled low awnings
and stone column bases; the entire street photograph is not an isolated measured elevation.
Screenshots with attribution/date remain in the task visualization folder, outside app assets.

The [official Phung Hung monument description](https://hoianworldheritage.org.vn/vi/news/Diem-di-tich/Nha-co-Phung-Hung-12.hwh)
identifies 4 Nguyen Thi Minh Khai, a deep timber merchant house, broad upper galleries,
stone-based timber columns and a four-direction middle roof between two-direction front/rear
roofs. Those structural distinctions guide the new-parcel kit. Its three model volumes and
column count are interpretive, not an exact measured reconstruction or a current furnishing survey.
Legacy non-parcel geometry and all parcel dimensions/positions remain unchanged.


## Quang Trieu follow-up — 2026-10-26 (before model changes)

Verified the Maps listing at 176 Tran Phu, Hoi An, not the namesake hall in Ho Chi Minh City.
Opened and rotated community 360 imagery: KTSMAP Bui Hai Giang, November 2024, entrance pano
`CIHM0ogKEICAgICPgPnabg`; Jan Reher, March 2024, courtyard pano `CIHM0ogKEICAgID9jtCmLQ`.
The gate has round stone columns, a raised central roof, smaller side roofs and red ironwork.
The courtyard view shows a ceramic coiled dragon pool, open central space, shaded side galleries,
steps to the three-bay sanctuary and raised ceramic roof ornaments. Date labels refer to imagery,
not a current on-site survey. Screenshots retain attribution in the task visualization folder.

Primary sources checked before code:
- [Heritage Centre monument entry](https://hoianheritage.net/vi/di-san-van-hoa/Hoi-quan/hoi-quan-quang-dong-chua-quang-dong-so-176-tran-phu-phuong-minh-an-156.html)
  confirms the Hoi An identity, community/religious function and structural timber/stone vocabulary.
- [Official heritage portal](https://hoianworldheritage.org.vn/vi/news/Diem-di-tich/Hoi-quan-Quang-Dong-17.hwh)
  identifies the sanctuary traditions and surviving bronze incense vessel.
- [Heritage Centre assembly-hall study](https://hoianheritage.net/vi/trao-doi-chuyen-nganh/chuyen-de-nghien-cuu-trao-doi/kien-truc-co-cac-hoi-quan-cua-nguoi-hoa-o-hoi-an-quang-nam-735.html)
  supports the central axis, open courts and longitudinal east/west galleries.

The new-parcel-only kit interprets those elements with original procedural geometry. It preserves
site.version1 dimensions and the entire legacy non-parcel kit. Neither decorative scale/column
counts nor foliage are claimed to be measured replicas. No Google asset is included in the app.


## Quan Cong Mieu follow-up — 2026-10-26 (before model changes)

Verified the monument at 24 Tran Phu, opposite Hoi An market. Google Maps official Street View
was opened and rotated: December 2021, pano `T_eBl61PBpUdwnLuU1HdkQ`. The camera label says
19 Tran Phu (the road capture location), not a replacement postal address for the monument.
It shows a continuous three-bay frontage, red columns, round green lattice windows, painted
central timber doors, stone threshold drums, low ironwork and pale glazed ridge ornaments.
An independent frontage image by Anh Hung, September 2019, corroborates the same facade.
Screenshots retain attribution/date in the task visualization folder, not app assets.

The listing's first community panorama (G Hine, January 2020) shows a different nearby courtyard.
Its interior photo by Stephen Rush (December 2016) cannot be confidently matched from the image
alone. Neither is used to infer this model's courtyard furniture, deity likeness or current state.
Do not treat every photograph attached to a Maps listing as a verified photograph of the monument.

Primary documents consulted before geometry:
- [Monument dossier, dated 30 September 1991](https://hoianheritage.net/uploads/download/m-01-quan-cong-mieu.pdf),
  page 2: three-bay street block, two connecting galleries around an open court, rear transverse
  hall, timber frame and glazed ceramic roof decoration. This is historical documentation, not a
  current measured plan. Its inventory supports a bell, drum and incense vessels; the model's
  exact placements are interpretive.
- [Heritage Centre entry](https://hoianheritage.net/vi/di-san-van-hoa/Mieu/mieu-quan-cong-chua-ong-trung-han-cung-so-24-duong-tran-phu-phuong-minh-an-255.html)
  confirms identity/location, restoration history and distinctive frame.
- [Official heritage portal, July 2025](https://www.hoianworldheritage.org.vn/vi/news/Du-lich-Hoi-An/le-via-quan-cong-o-hoi-an-2915.hwh)
  describes its living religious/community role. No deity likeness or festival is invented here.

Only the new-parcel kit changes. The four-volume footprint drives the open architecture and
construction/placement previews; the saved 5.8x7.2 game-unit site, orientation and 300-minute cost
remain unchanged. Existing non-parcel kit and all saved plans/history are preserved.


## Phuc Kien follow-up — 2026-10-26

Research was inspected before geometry changes. Google Maps verified the place at 46 Tran Phu,
15.8774847,108.3306281. The Street View entry opened a flat photograph, not a navigable panorama:
Olga Salih, April 2025, image CIHM0ogKEICAgICx-6vrpQE. It shows the pink masonry three-arch gate,
cream arch surrounds, green glazed roofs, raised central tower with an upper arch and tiered
eaves, ceramic ridge silhouettes and potted courtyard trees. A second photograph by MANH NGUYEN
HUU, July 2024, image CIHM0ogKEICAgMDo9cqgCw, confirms the open red-columned front hall, brown
tiles with green edges, lateral gallery and garden court. Provider/date overlays are retained
in task screenshots. These dated photos are not a present measured survey or Google driving
Street View. No reference photo, panorama or mesh is included as an app asset.

- [Heritage Centre architectural study, 10 October 2018](https://hoianheritage.net/vi/trao-doi-chuyen-nganh/chuyen-de-nghien-cuu-trao-doi/kien-truc-co-cac-hoi-quan-cua-nguoi-hoa-o-hoi-an-quang-nam-735.html)
  identifies the entrance, courts, three parallel transverse halls and longitudinal east/west
  galleries. Its historical dimensions are not assigned to saved game parcels.
- [Da Nang official tourism portal, page dated 1 January 2026](https://danangfantasticity.com/hoi-quan-phuc-kien)
  cross-checks the community/religious role, gates, bonsai and water garden. Founding accounts
  vary between sources; no new date, ritual or deity likeness is added to the game.

The new-parcel kit compresses the axial sequence into the existing immutable 7.2 x 7.2 game-unit
site: three transverse open halls, two side galleries, a court and distinct tiered three-arch
gate. This is an interpretive compression, not a 100-metre measured replica. Footprint previews
and construction use the same five-volume table. The gate uses an optional green roof palette
in the existing roof generator; default calls retain exactly their old output. Props are static,
without a new light, reflector or animation clock. Legacy geometry/site history and the
200-completed-focus-minute cost remain. FPS measurement is deferred by explicit request.
