# Full 360 city around the garden

Wrap a city skyline all the way around you, using the new painting as the front, with nothing stretched or repeated.

## What changes
- Keep the new skyline as the front view, exactly as it looks now.
- Paint three more matching city scenes in the same style (left, behind, right) that pick up where the front one ends, so the buildings line up across the joins and the city looks continuous all the way around.
- Join the four scenes into one seamless ring at the same building size as the front view, so nothing gets stretched.
- The starry sky dome stays overhead, and the top of each painting fades into it like it does now.
- Turning: you can spin a full circle on desktop, phone and in VR. Up and down limits stay as they are.
- Flying cars loop all the way around the city again.

## What stays the same
Garden, planters, Xion, care panel, moon, star twinkle and all interactions.

## Technical details
- Use edit_image to outpaint panels that continue from the left and right edges of the current image (and from each other), so their edges match. Join them into one strip about 4x as wide as it is tall, crossfade each join over a narrow band, and upload it as a new asset.
- Backdrop: arc = 2π, aspect taken from the joined strip; radius stays fixed so building size matches what you see now; edgeFade only blends the top into the sky. Remove the yaw clamp in XionCamera/config (LOOK). Set the FlyingCars lane arcs back to a full circle.
- Update config.test.ts for the new values; screenshot front, left, back and right on desktop and phone.
- Risk: AI outpainting may leave faint visible joins; if so, darken or hide them with skyscraper silhouettes at the joins.
