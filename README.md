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
| Тест | Jest (`jest-expo`) — домэйн логик 44 тест |

## Бүтэц

```
src/
  domain/                 # Цэвэр логик (native хамааралгүй, unit тесттэй)
    pose/                 #   17-цэгт pose модель, геометр, framing, rep-engine, analyzers
    plan/                 #   Дасгалын сан (46 дасгал, булчин бүрт 5+) + 7–30 хоногийн хөтөлбөр үүсгэгч, илчлэгийн тооцоо
    profile/              #   BMI, зорилтот жин, BMR/илчлэг (Mifflin–St Jeor), зорилтот жинд хүрэх хугацаа (timeline.ts)
    gamification/         #   XP/түвшин, badge, streak
  services/
    pose/usePoseDetector  #   VisionCamera frame processor → TFLite → keypoints (JS рүү зөвхөн 51 тоо дамжина)
    voice/coach           #   Дуут хөтөч (throttle, давтамж хязгаартай)
    notifications/        #   Сануулга, motivational quotes
    cloud/supabase        #   Сонголтот синк (зөвхөн профайл + статистик)
  store/                  # zustand persist stores (user, plan, progress, settings)
  features/               # Дэлгэцүүд: onboarding, plan, library (булчингаар), workout, progress, settings
  components/             # PoseOverlay (SVG), FramingGuide, StickFigureDemo, Confetti, UI kit
  i18n/                   # Монгол (үндсэн) + Англи
assets/models/            # movenet_singlepose_lightning_int8.tflite (2.9 MB, апп дотор багцлагдана)
assets/body/              # body-front.png, body-back.png — AI-аар үүсгэсэн анатомийн дүрс; булчингийн гэрэлтэх бүсүүд `domain/plan/bodyRegions.ts`-д SVG эллипсээр
assets/exercises/         # 46 зураг (jpg) + 46 давтагдах демо клип (mp4, ~70KB) — scripts/gen-exercise-assets.js map үүсгэнэ
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

Windows дээр `npx expo run:android` ажиллуулахад Android Studio, JDK 17 болон
`ANDROID_HOME` тохируулсан байх шаардлагатай.

Шалгалт:

```bash
npm run typecheck
npm test
npx expo-doctor         # config, хамаарлын хувилбарууд
```

### Асуудал гарвал

| Шинж тэмдэг | Шалтгаан |
|---|---|
| Expo Go дээр QR уншуулаад шууд унана | Энэ апп Expo Go дээр **ажиллахгүй**. `npx expo run:android` / `run:ios`-оор dev client суулгасны дараа `npm start` ажиллана. |
| `npm start` "No development build installed" | Төхөөрөмж дээр dev client байхгүй байна — дээрх `run:*` командыг эхлээд ажиллуул. |
| Metro асаад цагаан/хоосон дэлгэц | Фонт ачаалагдтал splash барьдаг. `assets/fonts/*.ttf` бүрэн эсэхийг шалга (8 файл). |
| `expo-doctor` хувилбарын зөрүү заана | `npx expo install --fix` — SDK-тай таарахгүй пакет апп нээгдэх үед унагаадаг. |
| Prebuild-ийн дараа өөрчлөлт нэвтрэхгүй | `ios/`, `android/` нь үүсгэгддэг хавтас (gitignore). `npx expo prebuild --clean`-ээр дахин үүсгэ. |

Сонголтот клауд синк: `.env.example` → `.env` болгож Supabase URL/anon key оруулна, `supabase/schema.sql`-ийг ажиллуулна. Хоосон үлдээвэл апп бүрэн offline горимд ажиллана.

## Шаардлагын хэрэгжилт

| Шаардлага | Хаана |
|---|---|
| Профайл, BMI, зорилтот жин (хэрэглэгч оруулна), хэмнэл (амархан/дунд/хүнд → хугацаа), дасгал сонголт | `domain/profile/bmi.ts`, `domain/profile/timeline.ts`, `features/onboarding/*` |
| Долоо хоногийн мөр (өнөөдөр тодорч, өдөр бүрийн төлөв — хийсэн/алгассан/товлосон/амралт), долоо хоног хооронд гүйлгэнэ | `domain/plan/weekStrip.ts`, `features/plan/WeekStrip.tsx` |
| Зорилтод хүртэлх хөтөлбөр (30 хоногийн хязгааргүй, 1 жил хүртэл), өдрийн илчлэг | `domain/plan/generator.ts` — хэрэглэгчийн сонгосон дасгалуудаас, дасгал бүрт +2–4% ачаалал (хэмнэлээс хамаарна), 4 дэх долоо хоног бүр deload, 3 долоо хоног тутам хүндрэлийн шатлал нээгдэнэ, сет 3→4→5; сет/тоог систем тооцно |
| Дасгал солих/өөрчлөх, заавар | `features/plan/DayDetailScreen`, `SwapExerciseScreen`, `ExerciseDetailScreen` (`assets/exercises/*.jpg` — AI-аар үүсгэсэн 12 зураг + `StickFigureDemo` анимэйшн) |
| Бодит цагийн pose detection (edge) | `services/pose/usePoseDetector.ts` |
| Бүтэн бие багтсан эсэх хүрээ | `domain/pose/framing.ts`, `components/FramingGuide.tsx` |
| Автомат тоолуур, өнцгийн шалгалт | `domain/pose/repEngine.ts`, `analyzers/` |
| Дуут хөтөч | `services/voice/coach.ts`, `i18n` → `feedback`, `voice` |
| Амралтын таймер + дуут дохио | `features/workout/sessionReducer.ts`, `WorkoutSessionScreen` |
| Push мэдэгдэл (сануулга, сэдэл) | `services/notifications/scheduler.ts`, `SettingsScreen` |
| Баяр хүргэх анимэйшн, badge, level, алгассан өдөрт XP хасах (хөтөлбөр дахин эхлэхгүй) | `WorkoutCompleteScreen`, `components/Confetti`, `domain/gamification/*` (`penalty.ts`: алгассан өдөр бүрт −30 XP) |
| Performance | Inference 24 FPS-ээр throttle, preview 30 FPS; int8 модель; JS рүү зөвхөн keypoints |
| Offline | Бүх store `AsyncStorage`-д persist, модель апп дотор |
| Privacy | Фрейм native worklet дотор л амьдарна; зураг/бичлэг хадгалагдахгүй, илгээгдэхгүй |

## Тэмдэглэл

- Монгол хэлний TTS дуу төхөөрөмж дээр суулгаагүй бол систем англи/өгөгдмөл дуугаар унших боломжтой; Тохиргооноос хэл солино.
- `burpee`, `mountain_climber` зэрэг нэг камераар найдвартай тоолоход хэцүү дасгалууд хугацаагаар (timed) явна; бусад 9 дасгал AI тоолуур/hold горимтой.
- Хэрэглэгч AI буруу тоолсон гэж үзвэл `+1 гараар` товчоор засах боломжтой.
- UI icon-ууд `components/Icon.tsx` (SVG line icons), emoji ашиглаагүй. Хүйс сонгоход Mars/Venus icon.
- Онбординг нэг дэлгэцэнд нэг асуулт (`features/onboarding/steps/`): хүйс → нас → жин → өндөр → зорилго → түвшин → зорилтот жин → хэмнэл → дасгал сонгох → профайл. Доор нь ахицын цэгүүд, Буцах/Үргэлжлүүлэх товч.
- Тоон сонголтууд `components/Wheel.tsx` — босоо (нас, өндөр) ба хэвтээ (жин) дугуй сонгогч; дундаж утга дээр төвлөрч нээгдэж, сонгогдсон утга томорч өнгөөр ялгарна, haptic feedback-тэй. Өндөр cm/ft, жин kg/lb-ээр сэлгэнэ (`domain/profile/units.ts`).
- Сэдэл: `domain/gamification/motivation.ts` өдрийн нөхцөлд (дараалал, буцаж ирэлт, амралт, төгсгөлийн шулуун…) тохирсон мессеж сонгоно; дасгалын үеэр хагас/сүүлийн давталтад урам өгнө; хөтөлбөрийн дэлгэц зорилтот жин хүртэлх ахицын цагирагтай.
- Дасгалын медиа: 46 зураг (GPT Image 2.5, Higgsfield платформ) + дасгал бүрийн 4 секундын давтагдах демо клип (Seedance 2.0 Mini, зургаас видео). Клипүүд GIF-ийн оронд 512×384 H.264 (`expo-video`, дуугүй, автомат давтагдана): GIF-ээр 46 × ~2.7MB = 125MB болох байсныг 4.6MB болгосон. `scripts/encode-exercise-videos.sh` эх клипийг дахин шахна; GIF хэрэгтэй бол ffmpeg-ээр ижил pipeline ашиглана.
- Дасгалын нэр англиар (Squat, Push-up…), заавар/зөвлөгөө монгол, англи хоёр хэлээр.
- Илчлэг: MET-д суурилсан загвар (дасгал бүрийн `met`, circuit коэффициент 1.25, амралтын үе 4.5 MET, хэрэглэгчийн жингээр масштаблана). Генератор өдрийн сешнийг **300–600 ккал** шатаахаар хэмждэг (амархан 300, дунд 400, хүнд 500-аас эхлэн дасгал бүрт өснө, 600-д хязгаарлана); сет/тоо/дасгалын тоог автоматаар тохируулж, сешн 70 минутаас хэтрэхгүй.
- Зорилтот жин: `estimateTargetTimeline` — өдрийн илчлэгийн зөрүү + дасгалаар шатаах илчлэгээс долоо хоногийн хурд (аюулгүй хязгаартай: турахад ≤1% жин/7 хоног, масс нэмэхэд ≤0.5 кг/7 хоног), хэдэн долоо хоног, ямар огноогоор хүрэх, санал болгох хөтөлбөрийн урт (7–30 хоног) × давталтын тоо.
