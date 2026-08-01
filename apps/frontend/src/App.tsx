import { FRONTEND_MODE } from "@/app/runtime/mode";
import ProductionApp from "@/app/ProductionApp";
import PrototypeApp from "@/app/PrototypeApp";

/**
 * Build-time app selector.
 * Production webpack builds replace `@/app/PrototypeApp` with a stub so mock
 * store/fixtures are not bundled.
 */
const App = FRONTEND_MODE === "production" ? ProductionApp : PrototypeApp;

export default App;
