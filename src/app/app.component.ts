import { NavigationStart, Router } from "@angular/router";
import { Component } from "@angular/core";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"],
})
export class AppComponent {
    title = "Winter Run";
    training = false;

    constructor(private router: Router) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                this.training = event.url === "/train";
            }
        });
    }

    downloadWeights() {
        // grab data from localStorage
        const episode = JSON.parse(localStorage.getItem("episode"));
        const weights = JSON.parse(localStorage.getItem("weights"));
        const data = {
            episode,
            weights,
        };
        // simulate a download click on an invisible element
        const element = document.createElement("a");
        element.setAttribute(
            "href",
            `data:text/json;charset=UTF-8,${encodeURIComponent(
                JSON.stringify(data)
            )}`
        );
        element.setAttribute("download", `agent-episode-${episode}.json`);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}
