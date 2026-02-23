# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Sana Sprint API Integration

This project uses the Sana Sprint API for generating clothing item images via the Gradio client.

- **API Endpoint**: https://sana.hanlab.ai/sprint/
- **No API key required** - uses the public Gradio API
- **Package**: `@gradio/client` (already installed)

The integration automatically:
- Connects to the Sana Sprint Gradio API
- Generates images based on your text prompts
- Handles image conversion and display

Each clothing category (Top, Trousers, Shoes) has its own text input box where you can describe the item you want to generate. Click the generate button next to each category to create the item.




Code explanation: 

Dressify Code Explanation
Part 1: File-by-file and step-by-step overview
How the app runs (step by step)
1. index.html creates #root, loads /src/main.tsx, and registers /sw.js.
2. src/main.tsx mounts <App /> and loads global styles.
3. src/App.tsx wires providers (React Query, tooltips, toasts) and routes /
to Index, * to NotFound.
4. src/pages/Index.tsx is the main app flow: consent gate, photo upload,
mock item generation, drag/drop canvas, and local save/load of outfits.
5. src/hooks/useOutfits.ts persists outfit data to localStorage key
dressify-outfits.
6. Components in src/components/ render each feature section.
7. src/components/ui/* are reusable shadcn/Radix primitives.
Core files
• src/main.tsx: React entrypoint.
• src/App.tsx: Providers + routing.
• src/pages/Index.tsx: Main app state and orchestration.
• src/pages/NotFound.tsx: 404 page.
• src/hooks/useOutfits.ts: Outfit CRUD in localStorage.
• src/components/UploadSection.tsx: Image upload.
• src/components/GeneratePanel.tsx: Mock AI generation.
• src/components/GeneratedItemsList.tsx: Generated thumbnails.
• src/components/CanvasEditor.tsx: Drag/drop item placement.
• src/components/OutfitLibrary.tsx: Saved outfit list.
• src/components/ConsentModal.tsx: Consent gate UI.
Configuration and build files
• package.json: scripts + deps.
• vite.config.ts: Vite config + alias @.
• vitest.config.ts: test config.
• tailwind.config.ts: theme and utility setup.
• postcss.config.js: Tailwind + autoprefixer.
• eslint.config.js: lint rules.
• tsconfig*.json: TypeScript settings.
• components.json: shadcn config.
Public assets
• public/manifest.json: PWA metadata.
• public/sw.js: service worker scaffold.
• public/robots.txt: crawler directives.
1
• public/favicon.ico: favicon.
• public/placeholder.svg: placeholder image asset.
Notes
• src/App.css is mostly Vite starter CSS and appears largely unused.
• src/components/ui/* are mostly generated component wrappers (accordion, dialog, toast, sidebar, etc.).
Part 2: Click-by-click user journey
1) App opens
1. Browser loads index.html.
2. main.tsx mounts <App />.
3. Router renders Index for /.
2) Consent
1. Index starts with consented=false.
2. ConsentModal is shown.
3. User clicks I Agree -> handleAgree() sets consent state -> main UI
appears.
3) Upload photo
1. User clicks upload zone or drops file.
2. UploadSection uses FileReader.readAsDataURL.
3. onPhotoChange(dataUrl) updates userPhoto in Index.
4. Photo preview and canvas background update.
4) Generate item
1. User clicks Top/Trousers/Shoes.
2. GeneratePanel.handleGenerate() calls mockGenerate().
3. Mock image is returned as data URL.
4. New GeneratedItem is sent to Index.
5. generatedItems updates and success toast appears.
5) Add to canvas
1. User clicks a generated thumbnail.
2. Index.handleAddToCanvas() creates CanvasItem with random start position.
3. Item appears in CanvasEditor.
2
6) Drag on canvas
1. Mouse down on item sets drag target.
2. Mouse move updates item x,y with bounds.
3. Mouse up clears drag state.
7) Save outfit
1. User enters name and clicks Save (or Enter).
2. handleSave() validates name.
3. saveOutfit() writes to state and localStorage.
4. Outfit appears in library.
8) Load outfit
1. User clicks load icon.
2. loadOutfit(id) returns matching outfit.
3. userPhoto + canvasItems are restored.
9) Delete outfit
1. User clicks trash icon.
2. deleteOutfit(id) filters and rewrites localStorage.
Part 3: Sequence diagram
sequenceDiagram
participant U as User
participant Upload as UploadSection.tsx
participant Index as Index.tsx
participant Gen as GeneratePanel.tsx
participant List as GeneratedItemsList.tsx
participant Canvas as CanvasEditor.tsx
participant Hook as useOutfits.ts
participant LS as localStorage
rect rgb(245,245,245)
note over U,Index: Upload flow
U->>Upload: Click dropzone / choose file
Upload->>Upload: handleFile(file) + FileReader.readAsDataURL
Upload->>Index: onPhotoChange(dataUrl)
Index->>Index: setUserPhoto(dataUrl)
Index-->>Upload: Re-render with photo preview
Index-->>Canvas: Re-render with background userPhoto
end
rect rgb(245,245,245)
3
note over U,Gen: Generate flow
U->>Gen: Click category button
Gen->>Gen: handleGenerate(category)
Gen->>Gen: setLoading(category)
Gen->>Gen: mockGenerate(category) -> dataUrl
Gen->>Index: onItemGenerated(item)
Index->>Index: setGeneratedItems([item,...prev])
Index->>Index: toast.success(...)
Index-->>List: Re-render with new thumbnail
end
rect rgb(245,245,245)
note over U,Canvas: Add + drag flow
U->>List: Click generated thumbnail
List->>Index: onAddToCanvas(item)
Index->>Index: setCanvasItems([...prev,newCanvasItem])
Index-->>Canvas: Re-render with draggable tile
U->>Canvas: MouseDown on tile
Canvas->>Canvas: handleMouseDown -> setDragging(id)
U->>Canvas: MouseMove
Canvas->>Index: onItemsChange(updatedItems)
Index->>Index: setCanvasItems(updatedItems)
Index-->>Canvas: Re-render tile at new x,y
U->>Canvas: MouseUp / MouseLeave
Canvas->>Canvas: setDragging(null)
end
rect rgb(245,245,245)
note over U,LS: Save / load / delete flow
U->>Index: Enter outfit name + click Save
Index->>Hook: saveOutfit(name,userPhoto,canvasItems)
Hook->>Hook: create Outfit object
Hook->>LS: setItem("dressify-outfits", updatedArray)
Hook-->>Index: return outfit
Index->>Index: clear name + toast.success
Index-->>U: Saved list updates
U->>Index: Click Load in OutfitLibrary
Index->>Hook: loadOutfit(id)
Hook-->>Index: outfit | null
Index->>Index: setUserPhoto + setCanvasItems
Index-->>U: Canvas restored
U->>Index: Click Delete in OutfitLibrary
Index->>Hook: deleteOutfit(id)
4
Hook->>LS: setItem("dressify-outfits", filteredArray)
Index-->>U: Outfit removed from list
end
5