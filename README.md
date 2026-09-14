# Dasgal — камерын тусламжтай ухаалаг дасгалын апп

Тоног төхөөрөмжгүйгээр гэртээ дасгал хийхэд зориулсан React Native (Expo) апп. Утасны камер
хүний биеийн тулгуур цэгүүдийг **төхөөрөмж дээр** (edge) бодит цагт таньж, squat, push-up зэрэг
дасгалын тоог автоматаар тоолж, буруу хийсэн үед дуут зөвлөгөө өгнө.

| Хэсэг | Технологи |
|---|---|
| UI | React Native 0.86 · Expo SDK 57 (dev client, prebuild) · React Navigation 7 |
| Камер | `react-native-vision-camera` 4 (frame processors, `react-native-worklets-core`) |
| Pose AI | TensorFlow Lite **MoveNet SinglePose Lightning (int8)** · `react-native-fast-tflite` · `vision-camera-resize-plugin` |
| Дуу | `expo-speech` (mn-MN / en-US) |
| Мэдэгдэл | `expo-notifications` (өдөр тутмын сануулга + сэдэлжүүлэх мэдэгдэл) |
| Өгөгдөл | `zustand` + `AsyncStorage` (offline-first) · сонголтоор Supabase синк |
| Тест | Jest (`jest-expo`) — домэйн логик 40 тест |

## Бүтэц

```
src/
  domain/                 # Цэвэр логик (native хамааралгүй, unit тесттэй)
    pose/                 #   17-цэгт pose модель, геометр, framing, rep-engine, analyzers
    plan/                 #   Дасгалын сан (12 дасгал) + 7–30 хоногийн хөтөлбөр үүсгэгч
    profile/              #   BMI, зорилтот жин, BMR/илчлэг (Mifflin–St Jeor)
    gamification/         #   XP/түвшин, badge, streak
  services/
    pose/usePoseDetector  #   VisionCamera frame processor → TFLite → keypoints (JS рүү зөвхөн 51 тоо дамжина)
    voice/coach           #   Дуут хөтөч (throttle, давтамж хязгаартай)
    notifications/        #   Сануулга, motivational quotes
    cloud/supabase        #   Сонголтот синк (зөвхөн профайл + статистик)
  store/                  # zustand persist stores (user, plan, progress, settings)
  features/               # Дэлгэцүүд: onboarding, plan, workout, progress, settings
  components/             # PoseOverlay (SVG), FramingGuide, StickFigureDemo, Confetti, UI kit
  i18n/                   # Монгол (үндсэн) + Англи
assets/models/            # movenet_singlepose_lightning_int8.tflite (2.9 MB, апп дотор багцлагдана)
```

### Хөдөлгөөн танилтын урсгал

1. `Camera` → frame processor worklet (native thread, ~24 FPS-ээр хязгаарласан).
2. `vision-camera-resize-plugin` фреймийг 192×192 RGB uint8 болгож эргүүлнэ.
3. `react-native-fast-tflite` MoveNet-ийг ажиллуулна (~10–15 ms CPU/XNNPACK).
4. Зөвхөн 17 × (x, y, score) утга `Worklets.createRunOnJS` ээр JS рүү очно — **пиксел хэзээ ч JS рүү очихгүй, хадгалагдахгүй.**
5. `PoseSmoother` (EMA) → `evaluateFraming` (бүтэн бие багтсан эсэх) → `ExerciseAnalyzer`.
6. `AngleRepCounter` — hysteresis төлөвт машин: `rest → active → rest` = 1 удаа. Хоёр босго (жишээ нь squat: өвдөгний өнцөг ≤100° "active", ≥160° "rest") хийснээр шуугианаас давхар тоолохгүй. Дутуу хийсэн (partial) хөдөлгөөнийг таньж “Доошоо сайн сууна уу” гэх мэт зөвлөгөө өгнө; form check-үүд (нурууны налуу, ташаа унжих, гар дээш өргөх…) тус тусдаа.
7. `HoldAnalyzer` — plank, wall sit гэх мэт статик дасгалын хугацааг зөвхөн зөв байрлалд байх үед хуримтлуулна.

Дасгал бүрийн тохиргоо `src/domain/pose/analyzers/index.ts`-д data-driven байдлаар бичигдсэн тул шинэ дасгал нэмэхэд metric функц + босго өгөхөд хангалттай. MediaPipe BlazePose (33 цэг) ашиглах бол `fromBlazePose()` адаптер бэлэн.

## Ажиллуулах

Frame processor, TFLite зэрэг native модуль ашигладаг тул **Expo Go дээр ажиллахгүй** — dev client / native build хэрэгтэй.

```bash
npm install
npx expo prebuild            # ios/ android/ үүсгэнэ (config plugin-ууд app.json-д)
npx expo run:android         # эсвэл: npx expo run:ios
npm start                    # dev client-той Metro
```

Шалгалт:

```bash
npm run typecheck
npm test
```

Сонголтот клауд синк: `.env.example` → `.env` болгож Supabase URL/anon key оруулна, `supabase/schema.sql`-ийг ажиллуулна. Хоосон үлдээвэл апп бүрэн offline горимд ажиллана.

## Шаардлагын хэрэгжилт

| Шаардлага | Хаана |
|---|---|
| Профайл, BMI, зорилтот жин, илчлэг | `domain/profile/bmi.ts`, `features/onboarding/*` |
| 7–30 хоногийн хөтөлбөр, өдрийн илчлэг | `domain/plan/generator.ts` (прогресс +10%/долоо хоног, deload, BMI/наснаас хамаарсан low-impact) |
| Дасгал солих/өөрчлөх, заавар | `features/plan/DayDetailScreen`, `SwapExerciseScreen`, `ExerciseDetailScreen` (`assets/exercises/*.jpg` — AI-аар үүсгэсэн 12 зураг + `StickFigureDemo` анимэйшн) |
| Бодит цагийн pose detection (edge) | `services/pose/usePoseDetector.ts` |
| Бүтэн бие багтсан эсэх хүрээ | `domain/pose/framing.ts`, `components/FramingGuide.tsx` |
| Автомат тоолуур, өнцгийн шалгалт | `domain/pose/repEngine.ts`, `analyzers/` |
| Дуут хөтөч | `services/voice/coach.ts`, `i18n` → `feedback`, `voice` |
| Амралтын таймер + дуут дохио | `features/workout/sessionReducer.ts`, `WorkoutSessionScreen` |
| Push мэдэгдэл (сануулга, сэдэл) | `services/notifications/scheduler.ts`, `SettingsScreen` |
| Баяр хүргэх анимэйшн, badge, level | `WorkoutCompleteScreen`, `components/Confetti`, `domain/gamification/*` |
| Performance | Inference 24 FPS-ээр throttle, preview 30 FPS; int8 модель; JS рүү зөвхөн keypoints |
| Offline | Бүх store `AsyncStorage`-д persist, модель апп дотор |
| Privacy | Фрейм native worklet дотор л амьдарна; зураг/бичлэг хадгалагдахгүй, илгээгдэхгүй |

## Тэмдэглэл

- Монгол хэлний TTS дуу төхөөрөмж дээр суулгаагүй бол систем англи/өгөгдмөл дуугаар унших боломжтой; Тохиргооноос хэл солино.
- `burpee`, `mountain_climber` зэрэг нэг камераар найдвартай тоолоход хэцүү дасгалууд хугацаагаар (timed) явна; бусад 9 дасгал AI тоолуур/hold горимтой.
- Хэрэглэгч AI буруу тоолсон гэж үзвэл `+1 гараар` товчоор засах боломжтой.
- UI icon-ууд `components/Icon.tsx` (SVG line icons), emoji ашиглаагүй. Дасгалын зургууд Higgsfield платформ дээр (Soul 2.0 + GPT Image 2.5) үүсгэсэн, 1024×768 JPEG, нийт ~250KB.
