import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { GameComponent } from "./game/game.component";

const routes: Routes = [
    {
        path: "play",
        component: GameComponent,
    },
    {
        path: "train",
        component: GameComponent,
    },
    {
        path: "**",
        redirectTo: "play",
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { relativeLinkResolution: "legacy" }),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
