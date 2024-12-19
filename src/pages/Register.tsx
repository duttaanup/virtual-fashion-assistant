import { BreadcrumbGroup, Button, CollectionPreferences, Container, Header, Pagination, SpaceBetween, Table, TextFilter } from "@cloudscape-design/components";
import { AppApi } from "../common/AppApi";
import { useEffect } from "react";

export default function Register() {
    useEffect(() => {
        AppApi.dbOperation();
        AppApi.confyOperation();
    }, [])
    return (
        <Container fitHeight header={
            <BreadcrumbGroup 
                items={[
                    { text: "Home", href: "#" },
                    { text: "Registration", href: "/registration" },
                ]}
            />
        }>
            <Table
                sortingDescending
                sortingDisabled
                stickyHeader
                stripedRows
                variant="embedded"
                columnDefinitions={[
                    {
                        id: "variable",
                        header: "Variable name",
                        cell: e => e.name,
                        sortingField: "name",
                        isRowHeader: true
                    },
                    {
                        id: "value",
                        header: "Text value",
                        cell: e => e.alt,
                        sortingField: "alt"
                    },
                    { id: "type", header: "Type", cell: e => e.type },
                    {
                        id: "description",
                        header: "Description",
                        cell: e => e.description
                    }
                ]}
                columnDisplay={[
                    { id: "variable", visible: true },
                    { id: "value", visible: true },
                    { id: "type", visible: true },
                    { id: "description", visible: true }
                ]}
                enableKeyboardNavigation
                items={[
                    {
                        name: "Item 1",
                        alt: "First",
                        description: "This is the first item",
                        type: "1A",
                        size: "Small"
                    },
                    {
                        name: "Item 2",
                        alt: "Second",
                        description: "This is the second item",
                        type: "1B",
                        size: "Large"
                    },
                    {
                        name: "Item 3",
                        alt: "Third",
                        description: "-",
                        type: "1A",
                        size: "Large"
                    },
                    {
                        name: "Item 4",
                        alt: "Fourth",
                        description: "This is the fourth item",
                        type: "2A",
                        size: "Small"
                    },
                    {
                        name: "Item 5",
                        alt: "-",
                        description:
                            "This is the fifth item with a longer description",
                        type: "2A",
                        size: "Large"
                    },
                    {
                        name: "Item 6",
                        alt: "Sixth",
                        description: "This is the sixth item",
                        type: "1A",
                        size: "Small"
                    }
                ]}
                loadingText="Loading users"
                trackBy="name"
                filter={
                    <TextFilter
                        filteringPlaceholder="Find User"
                        filteringText=""
                    />
                }
                header={
                    <Header
                        actions={
                            <SpaceBetween
                                direction="horizontal"
                                size="xs"
                            >
                                <Button variant="primary">
                                    Register User
                                </Button>
                            </SpaceBetween>
                        }
                    >
                        User Registration
                    </Header>
                }
                pagination={
                    <Pagination currentPageIndex={1} pagesCount={2} />
                }
                preferences={
                    <CollectionPreferences
                        title="Preferences"
                        confirmLabel="Confirm"
                        cancelLabel="Cancel"
                        pageSizePreference={{
                            title: "Page size",
                            options: [
                                { value: 10, label: "10 resources" },
                                { value: 20, label: "20 resources" },
                                { value: 30, label: "20 resources" },
                                { value: 40, label: "40 resources" },
                                { value: 50, label: "50 resources" }
                            ]
                        }}
                    />
                }
            />
        </Container>
    );

}