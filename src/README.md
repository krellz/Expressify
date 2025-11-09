# Expressify - AAC Communication App

A modern, intuitive mobile-first Augmentative and Alternative Communication (AAC) application designed for children with Autism Spectrum Disorder (ASD) and ADHD.

## Features

### 🎨 User-Friendly Design
- Clean, calming purple and orange color palette
- Large tap targets optimized for children
- Responsive mobile-first interface
- Smooth animations and transitions

### 👥 User Management
- Separate caregiver and child profiles
- Secure authentication with Supabase
- Session persistence across visits

### 📋 Communication Boards
- Create unlimited custom communication boards
- Search and add pictograms from ARASAAC API (30,000+ symbols)
- Drag-and-drop reordering
- Edit and delete boards

### 🗣️ Child Communication Mode
- Full-screen, distraction-free board view
- Large pictogram cards with clear labels
- Text-to-Speech on tap
- Visual and auditory feedback

## Setup Instructions

### Prerequisites
- Node.js 16+ installed
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/expressify.git
   cd expressify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase credentials**
   - Copy the example file:
     ```bash
     cp utils/supabase/info.example.tsx utils/supabase/info.tsx
     ```
   - Open `utils/supabase/info.tsx` and add your credentials:
     - Get your Project ID from Supabase Dashboard → Settings → General
     - Get your Anon Key from Supabase Dashboard → Settings → API
   
4. **Run the development server**
   ```bash
   npm run dev
   ```

### Supabase Setup

This app requires a Supabase project with:
- **Authentication**: Email/Password enabled
- **Edge Functions**: The server function in `/supabase/functions/server/`
- **Database**: Key-value store table (automatically created)

See the [Supabase documentation](https://supabase.com/docs) for detailed setup instructions.

## Getting Started

### First Time Users

1. **Sign Up**: Create a new account as a Caregiver
2. **Create a Board**: Click "Create New Board" 
3. **Add Pictograms**: Search for words like "happy", "hungry", "help", "water"
4. **Save**: Save your board
5. **View Mode**: Click "View" to enter Child Communication Mode

### Using the App

**Caregiver Dashboard:**
- View all your communication boards
- Create new boards for different contexts (morning routine, feelings, snack time, etc.)
- Edit existing boards
- Delete boards you no longer need

**Board Editor:**
- Enter a board title
- Search for pictograms using simple keywords
- Click pictograms from search results to add them
- Drag to reorder pictograms
- Click the X to remove pictograms
- Save your board

**Child Communication Mode:**
- Large, colorful pictogram cards
- Tap any pictogram to hear its name spoken aloud
- Visual feedback when tapped
- Simple back button to return

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth + Edge Functions + Database)
- **API**: ARASAAC Pictogram API
- **Text-to-Speech**: Web Speech API
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

## Tips for Caregivers

- Start with simple boards (5-10 pictograms)
- Create context-specific boards (meals, emotions, activities)
- Use consistent pictograms across boards
- Practice with your child during calm moments
- Gradually add more pictograms as they become comfortable

## Accessibility

- WCAG AA compliant color contrast
- Large touch targets (minimum 44x44px)
- Clear visual hierarchy
- Screen reader friendly
- Keyboard navigation support

## Security & Privacy

⚠️ **Important**: Never commit your `utils/supabase/info.tsx` file with real credentials to GitHub!

- All sensitive credentials are in `.gitignore`
- Use the provided `info.example.tsx` template
- Keep your Supabase Service Role Key private
- Review the `.gitignore` file before pushing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **ARASAAC**: Pictograms provided by [ARASAAC](https://arasaac.org/) under Creative Commons license
- Built for the autism and ADHD communities with input from caregivers and therapists

---

Built with ❤️ for inclusive communication
