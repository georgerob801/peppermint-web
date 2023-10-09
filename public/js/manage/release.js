$(document).ready(() => {
    $(".delete-button").on("click", async e => {
        let res = await $.ajax({
            url: `/api/project/${projectID}/release/${releaseTimestamp}`,
            type: "DELETE"
        });

        if (res?.status == 200) {
            window.location.href = `/manage/${projectID}`;
        }
    });

    $(".publish-button").on("click", async e => {
        let res = await $.ajax({
            url: `/api/project/${projectID}/release/${releaseTimestamp}/publish`,
            type: "POST"
        });

        if (res?.status == 200) {
            window.location.reload();
        }
    });

    $("form").submit(e => {
        e.preventDefault();
        
        (async () => {
            let data = {}

            if ($("#file")?.get(0)?.files?.length) {
                let uploadRes = await $.ajax({
                    url: "/api/upload",
                    type: "POST",
                    data: new FormData($("form")[0]),
                    processData: false,
                    contentType: false
                });

                data.file = uploadRes.uploadID
            }

            [
                "version",
                "releaseNotes",
                "timestampDate",
                "timestampTime",
            ].forEach(x => {
                if ($(`form [name=${x}]`).val()) data[x] = $(`form [name=${x}]`).val();
            });

            let releaseRes = await $.ajax({
                url: `/api/project/${projectID}/release/${releaseTimestamp}`,
                type: "POST",
                data
            });

            console.log(releaseRes);
            let newTimestamp;

            if (releaseRes.find(x => x.field == "timestampDate")) newTimestamp = releaseRes.find(x => x.field == "timestampDate")?.newTimestamp;
            if (releaseRes.find(x => x.field == "timestampTime")) newTimestamp = releaseRes.find(x => x.field == "timestampTime")?.newTimestamp;
            
            if (newTimestamp) window.location.href = `/manage/${projectID}/release/${newTimestamp}`;
            else window.location.reload();
        })()
    });
});