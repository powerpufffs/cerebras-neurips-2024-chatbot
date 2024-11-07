import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">NEURIPS 2024</h1>
        <p className="text-lg text-muted-foreground">
          powered by Cerebras Inference
        </p>
      </div>

      <div className="w-full max-w-2xl flex gap-3 ">
        <Input 
          type="search"
          placeholder="Search research papers"
          className="h-12 text-lg"
        />
        <Button variant={'outline'} className="h-15">Search</Button>
      </div>
    </div>
  )
} 