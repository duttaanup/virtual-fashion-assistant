import { Grid, } from "@cloudscape-design/components";

export default function Home() {
    return (
        <Grid
            gridDefinition={[{ colspan: 2 }, { colspan: 4 }, { colspan: 4 }, { colspan: 2 }]}
        >
            <div></div>
            <div>
                <a href="#/registration">
                    <div className="home_navigation_card registration_card">
                        <span className="home_navigation_title">Participants</span>
                    </div>
                </a>
            </div>
            <div>
                <a href="#/fashion">
                    <div className="home_navigation_card fashion_trial_card">
                        <span className="home_navigation_title">Trial</span>
                    </div>
                </a>
            </div>
            <div></div>
        </Grid>
    );
}