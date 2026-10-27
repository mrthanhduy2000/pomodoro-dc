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


## One map-led Hoi An direction — 2026-10-27

User explicitly makes this the main product direction: one Hoi An world, not three disconnected
old/future/parcel samples. Ultimate whole-city/geographic/cultural fidelity remains a continuing
objective; this release establishes a dated core and must not claim that objective is complete.

Research before implementation: Google Street View at19 Tran Phu, captured December2021,
pano T_eBl61PBpUdwnLuU1HdkQ, reopened and rotated along the street. It confirms connected
frontages, narrow paved street, thresholds and street activity. Screenshot preserves date/provider.
The [official visitor map](https://www.hoianworldheritage.org.vn/vi/maps.hwh) embeds a Google map;
[UNESCO's map register](https://whc.unesco.org/en/list/948/maps/) lists the1998 protection plan,
which is historical zoning evidence, not a current building survey. Its PDF capture timed out;
no uninspected plan detail is claimed.

Public coordinates come from the [OSM map API snapshot](https://api.openstreetmap.org/api/0.6/map?bbox=108.323,15.875,108.334,15.881),
retrieved2026-10-27:30 named street-way segments,8 monument references and2,660 building
envelopes. Selected roads include Tran Phu, Nguyen Thai Hoc, Bach Dang, Nguyen Thi Minh Khai,
Phan Chau Trinh, Le Loi, Hoang Van Thu, Chau Thuong Van, Cong Nu Ngoc Hoa and Nguyen Phuc Chu.
OSM IDs, original lat/lon, source and [ODbL attribution](https://www.openstreetmap.org/copyright)
are retained in the snapshot. The app contains no Google photo, tile, mesh or panorama asset.

Quality boundaries: OSM feature names/points are community map data, not cadastral certification.
Phuc Kien is a point marker, whereas several other references are feature-envelope centres.
Phuc Kien's model sits behind its marker by half the interpreted lot depth. Footprint envelopes
are rectangles aligned to a longest polygon edge; they are not the full source polygons. Heights,
roofs and generic foreground homes remain illustrative. Main bank offsets follow the mapped
Bach Dang centreline; creek/water envelopes are still stylised. Mapped centres do not establish
that every facade, resident, road width or historical period has been surveyed.

Expansion sequence: verify complete Tran Phu/Nguyen Thai Hoc/Bach Dang frontages and actual
water outlines first; then survey Thanh Ha, Kim Bong and Cam Thanh, including dated images,
road/parcel anchors, architecture and living practices. Those regions are marked pending instead
of presenting invented clusters as accurate geography. Old saved sites remain at their original
coordinates, even where they predate map-led placement. Never relocate them to fit a newer survey.

## Three-street frontage and quay follow-up — 2026-10-27

Survey before geometry:
- [Google Street View, Tran Phu](https://www.google.com/maps/@?api=1&map_action=pano&pano=T_eBl61PBpUdwnLuU1HdkQ): official panorama captured December2021, camera label19 Tran Phu,
  reopened and rotated along the street. Continuous low ochre shopfronts, raised thresholds,
  deep cloth awnings and a mix of low timber and upper masonry elevations. Camera address is
  not the identity of every frontage or of Quan Cong Mieu at24 Tran Phu.
- [Google Street View, Nguyen Thai Hoc](https://www.google.com/maps/@?api=1&map_action=pano&pano=PCpEeDePRBtX-cQ8B95uPQ): official panorama captured December2021, camera label95 Nguyen Thai Hoc,
  opened from the101 Tan Ky search and rotated longitudinally. Low timber shop openings alternate
  with two-storey masonry, louvred shutters, projecting mouldings and solid gallery balustrades;
  rectangular pavement and reddish thresholds. The search address is not the camera address.
- [Bach Dang community360](https://www.google.com/maps/@?api=1&map_action=pano&pano=CIHM0ogKEICAgIDqxaXDQg): 3DSolution, capture overlay June2019, contributor panel July2019,
  camera15.876052,108.329273. River-facing and longitudinal views inspected: flat paved promenade,
  low kerb, short pale capped mooring posts, tree openings, deep shop awnings and larger roofed
  passenger boats moored parallel to the bank. This is community360, not Google driving coverage.
  No continuous high railing or repeated water stairs is inferred from these views.

[Heritage Centre: Nha Pho](https://hoianheritage.net/vi/di-san-van-hoa/Nha-pho/nha-pho-261.html)
(29 September2015) supplies timber trading bays, paired door eyes, deep house sequences and
courtyards; [Binh do Hoi An](https://hoianheritage.danang.gov.vn/vi/trao-doi-chuyen-nganh/chuyen-de-nghien-cuu-trao-doi/Suy-nghi-ve-binh-do-Hoi-An-429.html)
(8 June2015) supports the parallel Bach Dang–Nguyen Thai Hoc–Tran Phu street structure and
continuous frontages. The sources are historical descriptions, not a measured contemporary census.

Implementation scope: bounded static street-facing details on existing mapped envelopes,
with corridor-specific timber openings, shutters, thresholds, cornices/galleries and awnings.
Selection follows the street-facing envelope edge, retaining up to two distinct faces for deep
houses between streets; it does not assign invented business names,
addresses or measured building histories. Existing centres, dimensions and saved sites stay.
The quay follows the already interpreted southward offset from the Bach Dang centreline;
walk width, waterline, elevation and mooring spacing are illustrative, not surveyed boundaries.
Original procedural materials/geometry only; screenshots remain research evidence outside the app.
Native pixels, lights, reflection count and resident simulation remain; FPS is deferred.

## Tan Ky and its two-street block — 2026-10-27

Research precedes this geometry change. Maps confirms101 Nguyen Thai Hoc. The opened listing
front photograph by Beat “Baccio” Lipp shows capture March2023, panel April2023: horizontal
removable timber boards, recessed central entry, upper central timber door, two green ceramic
vent panels, aged ochre plaster and a low tiled canopy. Neighbouring frontages differ in height,
shutters and masonry parapets. This photo confirms the named frontage, not neighbouring addresses.

The [Nguyen Thai Hoc neighbourhood360](https://www.google.com/maps/@?api=1&map_action=pano&pano=CIHM0ogKEICAgIDqhc_IkgE)
by3D Solution (capture June2019/panel July2019; camera15.876545,108.327837) shows adjacent
masonry balconies, timber shops and raised thresholds. It is not treated as Tan Ky's front.
The [Bach Dang block360](https://www.google.com/maps/@?api=1&map_action=pano&pano=CIHM0ogKEICAgIDqxfXfrwE)
by the same contributor/date (camera15.876187,108.328097), opened and rotated longitudinally,
shows a mix of low tiled service fronts, taller masonry, steps and recessed courts beside the
riverside road. The visible Tre Tre frontage is NOT labelled Tan Ky. Tan Ky's exact present rear
facade remains unverified; its service entrance is an architectural interpretation.

[Heritage Centre: Ngoi Nha co](https://hoianheritage.danang.gov.vn/vi/trao-doi-chuyen-nganh/chuyen-de-nghien-cuu-trao-doi/ngoi-nha-co-548.html)
(31 October2016) describes successive house ranges, a loft front without a projecting balcony,
central upper door and ceramic vents, horizontal timber panels and rear trading access.
[Heritage portal: Nha co Tan Ky](https://www.hoianworldheritage.org.vn/vi/news/Diem-di-tich/Nha-co-Tan-Ky-Hoi-An-13.hwh)
(20 December2010) cross-checks structural bays, stone column bases and a light well with side
ranges. Descriptions disagree on some timber/stone origins and counting of ranges; no material
provenance or exact range-count claim is encoded. Existing compressed footprints are retained.

Scope: improve only the parcel Tan Ky kit; legacy grid kit output stays. Keep saved sites,
footprints and minute accounting. A bounded subset of mapped context in this block gains hollow
roofed ranges, open courts, galleries and distinct front/rear doors inside its original envelope.
Individual context IDs retain their centres, dimensions and yaw. Variants are original interpreted
models, not claimed replicas of unverified numbered houses. No sourced photo is shipped as an asset.

Further reading of the2016 record places the connecting range on the right and the light well
on the left. The parcel kit therefore uses one covered gallery opposite a plaster court wall,
within the same collision footprint. The compact two-roof massing is still not a measured plan.

## Immediate Tan Ky neighbours — 2026-10-28

Address checks precede models. [Heritage Centre2014 gallery list](https://hoianheritage.net/vi/news/Tin-tuc-su-kien/Gian-trung-bay-tac-pham-nghe-thuat-T-G-va-Ami-tai-Diem-dung-chan-57-Tran-phu-nam-trong-top-10-diem-trung-bay-hap-dan-tai-Khu-di-san-van-hoa-the-gioi-Hoi-An-313.html)
records Phu Tam Photography at99 Nguyen Thai Hoc. The [heritage business list](https://www.hoianworldheritage.org.vn/vi/news/Dich-vu-uy-tin-chat-luong/Diem-kinh-doanh-dat-chuan-Van-minh-510.hwh)
records Reaching Out at103 in its2012 table. These are dated tenants, not present occupancy claims.
Maps currently associates103 with The Spice Route and99 with Ha Gia. The Maps99 point lies
unhelpfully close to Tan Ky; it is NOT used to overwrite any map coordinates or saved sites.

Observed images:
- Official Google Street View, [pano C--UD1xXeg-VGFv8JvtU5Q](https://www.google.com/maps/@?api=1&map_action=pano&pano=C--UD1xXeg-VGFv8JvtU5Q), December2021,
  camera label106 Nguyen Thai Hoc, facing the103 Reaching Out sign. Camera label is not facade
  address. Two tall pale masonry shoulders, blue-grey louvred shutters, continuous cornice,
  tiled cap, recessed full-height central entrance and patterned panels below ground shutters.
  Tilted upward to inspect the upper storey. Tan Ky is visibly adjacent.
- Ha Gia owner frontage photograph, September2023, opened from its Maps listing at99:
  two-storey ochre frontage, masonry balcony with oval openings, shaped upper surrounds,
  shallow awning and shop recessed behind several steps; clothing racks in the apron.
  Image ID CIHM0ogKEICAgICZhpj4Mw. The neighbouring March2023 Tan Ky photograph contains a99A
  sign, while the business listing says99. Use99–99A as a qualified group, not a proven
  subdivision/ownership statement. No branded business sign is reconstructed in the model.
- Spice Route owner interior, October2026: timber posts/ceiling, long shelves and a deep
  shop axis. It informs modest original interior props, not a replication of products or brands.

Render-only profile103 is associated with context envelope595299312 and99–99A with631066781,
using relative street order and approximate frontage location. This association is interpretive,
not cadastral identification. Their source centres/yaw and the map snapshot stay unchanged.
Fixed compressed display widths fit the existing protected lots in both preview modes; a
profile is omitted on a new collision rather than resizing an earned building or changing its
own dimensions with progress. Display width stays above55% of the source envelope width. Never remove, relocate or shrink an earned building for a sample.
The existing source navigator exposes the two dated facade views and their uncertainty.
Original procedural geometry/materials only; research photographs remain outside the app.

The99 reference link opens the correct Maps listing/gallery; Google may reset it to the first
photo rather than retain the selected September2023 frontage. The source date belongs to the
inspected frontage, not every picture in that gallery. The103 link includes the observed heading.
