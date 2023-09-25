const contributorHMTL = user => {
    
}

$("document").ready(() => {
    const projectID = $(".project-id").text();
    $.ajax({
        url: `/api/project/${projectID}/contributors`,
        type: "GET",
        success: res => {
            console.log("ehuvifhekjsrbfduj");
            console.log(res);
        }
    });
});